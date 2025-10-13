# 🐛 Backend Issue: toggleSave no soporta itemType='moment'

**Fecha**: 2025-10-11
**Status**: ⚠️ Pendiente (Backend)
**Prioridad**: Media
**Workaround Frontend**: ✅ Botón Save deshabilitado temporalmente

---

## 🎯 Problema

La mutation GraphQL `toggleSave` **no soporta** `itemType='moment'`, solo soporta `itemType='product'`.

### Error en Lambda

```json
{
  "data": null,
  "errors": [{
    "path": ["toggleSave"],
    "data": null,
    "errorType": "Lambda:Unhandled",
    "errorInfo": null,
    "message": "itemType 'moment' no soportado para saves"
  }]
}
```

### Mutation GraphQL (Frontend)

```graphql
mutation ToggleSave($item_id: ID!, $item_type: String!) {
  toggleSave(item_id: $item_id, item_type: $item_type) {
    success
    newSaveCount
    viewerHasSaved
  }
}
```

**Variables enviadas**:
```json
{
  "item_id": "68eaff0bc822f6be2d2ed688",
  "item_type": "moment"
}
```

---

## 🔍 Causa Raíz

La Lambda function que implementa `toggleSave` probablemente tiene una validación que **solo permite** `itemType='product'`:

```python
# Ejemplo hipotético de la Lambda function
def toggle_save(event, context):
    item_type = event['arguments']['item_type']

    # ❌ Validación actual (solo soporta products)
    if item_type != 'product':
        raise Exception(f"itemType '{item_type}' no soportado para saves")

    # ... resto de la lógica
```

---

## ✅ Solución Requerida (Backend)

### Paso 1: Actualizar Lambda Function

Actualizar la función Lambda que implementa `toggleSave` para soportar `itemType='moment'`:

```python
# Ejemplo de fix en Lambda (Python)
def toggle_save(event, context):
    item_type = event['arguments']['item_type']
    item_id = event['arguments']['item_id']
    user_id = event['identity']['sub']

    # ✅ Validación actualizada (soporta products y moments)
    ALLOWED_TYPES = ['product', 'moment']

    if item_type not in ALLOWED_TYPES:
        raise Exception(f"itemType '{item_type}' no soportado. Tipos permitidos: {ALLOWED_TYPES}")

    # Determinar tabla según tipo
    if item_type == 'product':
        table_name = 'ProductSaves'
    elif item_type == 'moment':
        table_name = 'MomentSaves'

    # Buscar save existente
    existing_save = dynamodb.get_item(
        TableName=table_name,
        Key={
            'user_id': user_id,
            'item_id': item_id
        }
    )

    if existing_save:
        # Eliminar save (toggle off)
        dynamodb.delete_item(...)
        viewer_has_saved = False
    else:
        # Crear save (toggle on)
        dynamodb.put_item(...)
        viewer_has_saved = True

    # Contar total de saves del item
    save_count = dynamodb.query(
        TableName=table_name,
        IndexName='ItemIdIndex',
        KeyConditionExpression='item_id = :item_id',
        ExpressionAttributeValues={':item_id': item_id}
    ).Count

    return {
        'success': True,
        'newSaveCount': save_count,
        'viewerHasSaved': viewer_has_saved
    }
```

### Paso 2: Actualizar Schema GraphQL (si necesario)

Verificar que el schema de AppSync tenga el resolver configurado correctamente:

```graphql
type Mutation {
  toggleSave(item_id: ID!, item_type: String!): ToggleSaveResponse
}

type ToggleSaveResponse {
  success: Boolean!
  newSaveCount: Int!
  viewerHasSaved: Boolean!
}
```

### Paso 3: Crear Tabla DynamoDB para Moment Saves (si no existe)

Si no existe tabla para guardar "saves" de Moments, crearla:

**Tabla**: `MomentSaves` o `Save` (tabla unificada)

**Schema**:
```javascript
{
  PK: "USER#<user_id>",           // Partition Key
  SK: "SAVE#MOMENT#<moment_id>",  // Sort Key
  user_id: "cognito_sub",
  item_id: "moment_id",
  item_type: "moment",
  created_at: "2025-10-11T22:00:00Z",

  // GSI para contar saves por item
  GSI1PK: "MOMENT#<moment_id>",
  GSI1SK: "USER#<user_id>"
}
```

**Índices**:
- **Primary Key**: PK + SK (para queries por usuario)
- **GSI1**: GSI1PK + GSI1SK (para contar saves por moment)

---

## 🔄 Workaround Temporal (Frontend)

Mientras el backend no soporte `itemType='moment'`, el botón de Save está **deshabilitado** con un tooltip "Próximamente".

**Archivo modificado**: `/src/components/moments/MomentCard.tsx`

```typescript
{/* Save button - TEMPORALMENTE DESHABILITADO */}
<button
  onClick={handleSave}
  disabled={true}
  className="opacity-30 cursor-not-allowed relative group"
  aria-label="Guardar (próximamente)"
  title="Función en desarrollo"
>
  <svg className="w-6 h-6 text-gray-400" ...>
    <!-- Icono bookmark -->
  </svg>

  {/* Tooltip */}
  <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
    Próximamente
  </span>
</button>
```

**Cuando el backend esté listo**:
1. Cambiar `disabled={true}` → `disabled={isPending}`
2. Restaurar `className` dinámico con optimistic update
3. Remover tooltip "Próximamente"
4. Habilitar color dinámico (gris → amarillo al guardar)

---

## 🧪 Testing

### 1. Crear tabla y función Lambda

```bash
# Deploy de infraestructura (CDK, SAM, etc.)
cdk deploy MomentSavesStack
```

### 2. Test manual con Postman/Insomnia

```graphql
mutation TestToggleSave {
  toggleSave(
    item_id: "68eaff0bc822f6be2d2ed688",
    item_type: "moment"
  ) {
    success
    newSaveCount
    viewerHasSaved
  }
}
```

**Respuesta esperada**:
```json
{
  "data": {
    "toggleSave": {
      "success": true,
      "newSaveCount": 1,
      "viewerHasSaved": true
    }
  }
}
```

### 3. Test en frontend

Una vez implementado el backend, habilitar el botón en `MomentCard.tsx` y verificar:

1. Click en botón Save → Icono se vuelve amarillo
2. Click otra vez → Icono vuelve a gris
3. Refresh página → Estado persiste correctamente
4. Verificar contador `newSaveCount` actualiza

---

## 📊 Impacto

### UX Impact

| Aspecto | Estado Actual | Después del Fix |
|---------|---------------|-----------------|
| Botón Save visible | ✅ Sí | ✅ Sí |
| Botón Save funcional | ❌ No (deshabilitado) | ✅ Sí |
| Tooltip "Próximamente" | ✅ Sí | ❌ No |
| Feedback optimista | ❌ No | ✅ Sí |
| Guardar moments | ❌ No | ✅ Sí |

### Database Impact

**Antes del fix**:
- Solo tabla `ProductSaves` o similar

**Después del fix**:
- Tabla `MomentSaves` o añadir `item_type='moment'` a tabla unificada `Save`

---

## 🎯 Acceptance Criteria

- [ ] Lambda function acepta `item_type='moment'`
- [ ] Tabla DynamoDB para MomentSaves creada (o tabla unificada actualizada)
- [ ] Mutation retorna `{ success: true, newSaveCount: N, viewerHasSaved: boolean }`
- [ ] Error `"itemType 'moment' no soportado para saves"` ya no ocurre
- [ ] Frontend puede toggle save en moments sin errores
- [ ] Save count actualiza correctamente
- [ ] Estado persiste después de refresh

---

## 📚 Referencias

- `/src/lib/server/moments-actions.ts:330` - Server Action `toggleSaveAction`
- `/src/components/moments/MomentCard.tsx:150` - Botón Save temporalmente deshabilitado
- `/src/lib/graphql/operations.ts:319` - Mutation `toggleSave`
- [AWS AppSync Resolvers](https://docs.aws.amazon.com/appsync/latest/devguide/resolver-mapping-template-reference.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

---

## 📋 Action Items

### Backend Team
- [ ] Actualizar Lambda function para soportar `itemType='moment'`
- [ ] Crear/actualizar tabla DynamoDB para saves de moments
- [ ] Deploy en ambiente de desarrollo
- [ ] Testing con Postman/Insomnia
- [ ] Deploy en staging
- [ ] Deploy en producción

### Frontend Team (Después del backend)
- [ ] Habilitar botón Save en `MomentCard.tsx`
- [ ] Remover tooltip "Próximamente"
- [ ] Restaurar estilos dinámicos (optimistic update)
- [ ] Testing E2E
- [ ] Deploy

---

**Última actualización**: 2025-10-11 22:45
**Reportado por**: Frontend Team
**Asignado a**: Backend Team
**Prioridad**: Media (no bloqueante, workaround temporal activo)
**Estimación**: 2-4 horas de desarrollo backend
