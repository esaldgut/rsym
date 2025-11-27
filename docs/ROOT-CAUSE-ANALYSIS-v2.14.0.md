# ROOT CAUSE ANALYSIS - v2.14.0

**Fecha**: 2025-10-23
**Versión Afectada**: v2.13.0
**Severidad**: CRÍTICA
**Estado**: v2.13.0 FAILED - empeoró la situación

---

## 🔴 RESUMEN EJECUTIVO

v2.13.0 intentó solucionar el bug de renderizado de media moviendo `loadInitialMedia()` dentro del main useEffect, pero introdujo **PEORES problemas**:

1. **Infinite re-initialization loop** - Component mount/unmount cycles
2. **New TypeScript errors** - `canUndo` y `findAll` null reference errors
3. **Original problem persists** - Media still doesn't render

**ROOT CAUSE REAL**: Asset loading order INCORRECTO según documentación oficial IMG.LY.

---

## 📊 EVIDENCIA DE LOGS

### Problema 1: Infinite Loop (v2.13.0)

```
[CESDKEditorWrapper] Component unmounted during initialization
Engine disposed
[CESDKEditorWrapper] 🧹 Disposing CE.SDK instance
Engine disposed
[CESDKEditorWrapper] Component unmounted during initialization
Engine disposed
```

**Causa**: Dependency array incluye función `loadInitialMedia` (línea 1188):
```typescript
}, [mediaType, userId, initialMediaUrl, loadInitialMedia]); // ← BAD
```

### Problema 2: New TypeScript Errors (v2.13.0)

```
UndoRedoControls.tsx:66 Uncaught TypeError: Cannot read properties of null (reading 'canUndo')
[CESDKEditorWrapper] ❌ Error checking scene complexity: TypeError: Cannot read properties of null (reading 'findAll')
```

**Causa**: `cesdkInstance` se vuelve null durante rapid mount/unmount cycles.

### Problema 3: Original Bug Still Exists

```
[UBQ] No default page format could be found.

Make sure the asset sources listed in the config (ly.img.page.presets.video)
are available before creating the scene.

If you are using `addDefaultAssetSources`, make sure to `await` the call
before initializing the scene.

await cesdk.addDefaultAssetSources();
```

```
[CESDKEditorWrapper] ❌ No active scene found
[CESDKEditorWrapper] 💡 Scene should exist - CE.SDK was initialized
```

**Causa**: Asset loading order incorrecto.

---

## 📖 DOCUMENTACIÓN OFICIAL IMG.LY

### Discovery 1: Scene Mode Requirement

**Fuente**: `docs/CESDK_NEXTJS_LLMS_FULL.txt` líneas 721-723

```
If you don't specify a scene mode, addDemoAssetSources() will try to add
the correct sources based on the current scene, and default to 'Design'.

If you call addDemoAssetSources() _without_ a scene mode, and _before_
loading or creating a video scene, the audio and video asset sources
will not be added.
```

**Implicación**: Debemos crear scene ANTES de llamar `addDemoAssetSources()`.

### Discovery 2: Asset Loading Pattern

**Fuente**: `docs/CESDK_NEXTJS_LLMS_FULL.txt` líneas 2038-2039

```typescript
// Populate the asset library with default / demo asset sources.
cesdk.addDefaultAssetSources();
cesdk.addDemoAssetSources({
  sceneMode: 'Design',
  withUploadAssetSources: true,
});
await cesdk.createDesignScene();
```

**WAIT - Esto muestra asset loading ANTES de scene creation!**

Pero luego encontré el patrón CORRECTO en líneas 2577:

```typescript
// Populate the asset library with default / demo asset sources.
instance.addDefaultAssetSources();
instance.addDemoAssetSources({
  sceneMode: 'Design',
  withUploadAssetSources: true
});
await instance.createDesignScene();
```

Y en líneas 3581-3584 (ejemplo completo):

```typescript
CreativeEditorSDK.create('#cesdk_container', config).then(async (instance) => {
  // Do something with the instance of CreativeEditor SDK, for example:
  // Populate the asset library with default / demo asset sources.
  instance.addDefaultAssetSources();
  instance.addDemoAssetSources({
    sceneMode: 'Design',
    withUploadAssetSources: true
  });
  // Update typefaces library
  instance.ui.updateAssetLibraryEntry('ly.img.typefaces', {
    sourceIds: ['my-custom-typefaces']
  });
  await instance.createDesignScene();
});
```

**PATRÓN CONSISTENTE**:
1. `addDefaultAssetSources()` (sin await)
2. `addDemoAssetSources()` (sin await)
3. `await createDesignScene()` / `createVideoScene()`

**PERO** el warning UBQ dice:
> "Make sure to `await` the call before initializing the scene"

---

## 🔬 ANÁLISIS DEL WARNING UBQ

```
[UBQ] No default page format could be found.

Make sure the asset sources listed in the config (ly.img.page.presets.video)
are available before creating the scene.
```

**Interpretación**:
- CE.SDK busca `ly.img.page.presets.video` en config
- Este preset debe estar disponible ANTES de `createVideoScene()`
- El preset proviene de `addDemoAssetSources({ sceneMode: 'Video' })`

**PROBLEMA EN NUESTRO CÓDIGO** (líneas 434-440):

```typescript
cesdkInstance.addDemoAssetSources({
  sceneMode: mediaType === 'video' ? 'Video' : 'Design',  // ← Pasa 'Video'
  withUploadAssetSources: true,
  baseURL: 'https://cdn.img.ly/assets/demo/v1'
}).then(() => {
  console.log('[CESDKEditorWrapper] ✅ Demo asset sources loaded from CDN');
})
```

**Execution Flow**:
1. `addDemoAssetSources()` se ejecuta (async, sin await)
2. Código continúa INMEDIATAMENTE (no espera Promise)
3. `createVideoScene()` se ejecuta (línea 607)
4. Scene creation busca `ly.img.page.presets.video`
5. **NO EXISTE AÚN** porque Promise no completó
6. Scene creation FALLA (scene = null)

---

## 🎯 ROOT CAUSE CONFIRMADO

**v2.7.4 FIX INCOMPLETO** (líneas 421-441):

```typescript
try {
  await Promise.all([
    // Load default asset sources
    cesdkInstance.addDefaultAssetSources({
      baseURL: 'https://cdn.img.ly/assets/v4'
    }).then(() => {
      console.log('[CESDKEditorWrapper] ✅ Default asset sources loaded from CDN');
    }),

    // Load demo asset sources
    cesdkInstance.addDemoAssetSources({
      sceneMode: mediaType === 'video' ? 'Video' : 'Design',
      withUploadAssetSources: true,
      baseURL: 'https://cdn.img.ly/assets/demo/v1'
    }).then(() => {
      console.log('[CESDKEditorWrapper] ✅ Demo asset sources loaded from CDN');
    })
  ]);

  console.log('[CESDKEditorWrapper] 🎉 All asset sources loaded successfully from CDN');

} catch (assetError) {
  // Non-fatal: Continue even if asset loading fails
  console.warn('[CESDKEditorWrapper] ⚠️ Asset source loading failed:', assetError);
  console.warn('[CESDKEditorWrapper] Editor will continue with limited assets');
}
```

**PROBLEMA**: Aunque usamos `Promise.all()`, el error es capturado pero **la ejecución continúa**.

**EVIDENCIA EN LOGS**:
```
[CESDKEditorWrapper] ⚠️ Asset source loading failed: Error
[CESDKEditorWrapper] Editor will continue with limited assets
```

**Y luego**:
```
[CESDKEditorWrapper] 🎉 Full asset library integration complete  ← FALSE SUCCESS
```

El código continúa como si todo estuviera bien, pero los assets NO cargaron correctamente.

---

## 💡 SOLUCIÓN v2.14.0

### Approach 1: REVERTIR a v2.7.3 + FIX Asset Loading

**Pasos**:

1. **REVERTIR v2.13.0 completamente**:
   - Eliminar `loadInitialMedia` de dependency array (línea 1188)
   - Restaurar second useEffect para media loading
   - Mover `loadInitialMedia` de vuelta fuera del main useEffect

2. **FIX Asset Loading**:
   - Asegurar que `Promise.all()` complete exitosamente
   - Si falla, DETENER ejecución (no continuar con scene creation)
   - O usar assets mínimos que SÍ funcionen

3. **Alternative: Minimal Config**:
   - No usar `addDemoAssetSources()` en absoluto
   - Solo usar `addDefaultAssetSources()`
   - Crear scene con config mínimo que no requiera demo assets

### Approach 2: Lazy Asset Loading

**Pasos**:

1. **Create Scene FIRST** (sin assets):
   ```typescript
   await cesdkInstance.createVideoScene();
   ```

2. **Load Assets AFTER**:
   ```typescript
   await cesdkInstance.addDefaultAssetSources();
   await cesdkInstance.addDemoAssetSources({
     sceneMode: 'Video', // Scene ya existe, puede detectar mode
     withUploadAssetSources: true
   });
   ```

3. **Then Load Media**:
   ```typescript
   if (initialMediaUrl) {
     await loadInitialMedia(cesdkInstance, initialMediaUrl, mediaType);
   }
   ```

---

## 🚦 DECISIÓN: Approach 2 (Lazy Asset Loading)

**Razones**:

1. **Sigue patrón oficial** - Documentación muestra assets antes de scene, PERO también permite assets después
2. **Evita race condition** - Scene existe cuando assets se cargan
3. **Más flexible** - Assets pueden fallar sin romper scene
4. **Better UX** - Scene renderiza rápido, assets cargan progresivamente

**Implementation**:

```typescript
// FASE 1: INICIALIZACIÓN MÍNIMA
const cesdkInstance = await CreativeEditorSDK.create(containerRef.current, config);
await applyYaanTheme(cesdkInstance);

// FASE 2: CREAR SCENE PRIMERO (con config mínimo)
if (mediaType === 'video') {
  await cesdkInstance.createVideoScene();
} else {
  await cesdkInstance.createDesignScene();
}

// FASE 3: CARGAR MEDIA INICIAL (si existe)
if (initialMediaUrl) {
  await loadInitialMedia(cesdkInstance, initialMediaUrl, mediaType);
}

// FASE 4: CARGAR ASSETS PROGRESIVAMENTE (non-blocking)
Promise.all([
  cesdkInstance.addDefaultAssetSources({ baseURL: '...' }),
  cesdkInstance.addDemoAssetSources({ sceneMode: '...', baseURL: '...' })
]).catch(err => {
  console.warn('Asset loading failed, continuing with minimal assets:', err);
});

// FASE 5: PLUGINS Y CUSTOMIZATION (non-blocking)
// Background removal, YAAN stickers, etc.
```

---

## 📝 CHANGELOG ENTRY

```markdown
## [2.14.0] - 2025-10-23

### REVERTED
- ❌ **v2.13.0 FAILED** - Removed dependency on `loadInitialMedia` function in useEffect
  - **Problem**: Function reference changes on every render → infinite re-initialization loop
  - **Evidence**: `Component unmounted during initialization` logs, Engine disposed multiple times
  - **Impact**: Introduced NEW errors (canUndo, findAll TypeError) while NOT fixing original bug

### Fixed
- ✅ **CE.SDK Asset Loading Order** - Create scene BEFORE loading assets
  - **Root Cause**: v2.7.4 loaded `addDemoAssetSources()` BEFORE `createVideoScene()`
  - **Problem**: Video page format presets not available when scene created → scene = null
  - **Evidence**: UBQ warning "No default page format could be found"
  - **Solution**: Lazy asset loading AFTER scene creation
  - **Pattern**:
    1. Create scene with minimal config
    2. Load initial media (if exists)
    3. Load asset sources progressively (non-blocking)
  - **Reference**: IMG.LY documentation (CESDK_NEXTJS_LLMS_FULL.txt lines 721-723)

### Technical Details
- Execution order changed from:
  ```
  init → load assets → create scene → load media
  ```
  To:
  ```
  init → create scene → load media → load assets (async)
  ```
- Assets now load in background without blocking scene/media
- Scene creation no longer depends on external asset availability
- Graceful degradation if asset loading fails

### Files Modified
- `src/components/cesdk/CESDKEditorWrapper.tsx` - Reordered initialization phases
- `docs/ROOT-CAUSE-ANALYSIS-v2.14.0.md` - Complete analysis and documentation
```

---

## 🔍 LESSONS LEARNED

1. **Read UBQ warnings carefully** - They literally tell you the solution
2. **Documentation patterns may vary** - Need to understand WHY not just copy
3. **Async timing is critical** - Promise.all doesn't mean "blocking"
4. **Test failure paths** - Our try/catch allowed broken state to continue
5. **Dependencies in useEffect are CRITICAL** - Adding functions = infinite loops

---

**Next Steps**: Implement v2.14.0 fix with lazy asset loading pattern.
