# ✅ Checklist de Verificación - Cookies HTTP-only

## Estado: ACTIVADO 🟢

El proyecto ahora está configurado para usar cookies HTTP-only. Sigue estos pasos para verificar:

## 1. Verificación en el Navegador

### Pasos:
1. Abre http://localhost:3000
2. Abre DevTools (F12)
3. Ve a la pestaña **Application** (Chrome) o **Storage** (Firefox)
4. Busca la sección **Cookies**

### Antes de iniciar sesión:
- [ ] No deberían existir cookies de Amplify

### Después de iniciar sesión:
- [ ] Deberían aparecer cookies con prefijo como:
  - `CognitoIdentityServiceProvider.*`
  - `amplify-*`
- [ ] Las cookies deben tener la columna **HttpOnly** marcada como ✓
- [ ] Las cookies deben tener **SameSite** = Lax
- [ ] En desarrollo, **Secure** = false (en producción será true)

## 2. Verificación de localStorage

### Pasos:
1. En DevTools, ve a **Application** > **Local Storage**
2. Busca el dominio localhost:3000

### Resultado esperado:
- [ ] NO deben existir tokens en localStorage
- [ ] NO debe haber keys como `accessToken`, `idToken`, `refreshToken`

## 3. Prueba de Seguridad XSS

### En la consola del navegador, intenta:
```javascript
// Esto NO debería funcionar
document.cookie
// Las cookies HttpOnly no aparecerán

// Esto tampoco debería mostrar tokens
localStorage.getItem('accessToken')
// Debería retornar null
```

## 4. Prueba de Funcionalidad

- [ ] Login funciona correctamente
- [ ] La sesión persiste al recargar la página
- [ ] Logout limpia las cookies
- [ ] OAuth con proveedores externos funciona

## 5. Verificación SSR

- [ ] Visita http://localhost:3000/dashboard/page-ssr
- [ ] La página debe mostrar datos del usuario si estás autenticado
- [ ] Si no estás autenticado, debe redirigir a /auth/login

## Troubleshooting

### Si las cookies no se establecen:
1. Verifica que `USE_HTTP_ONLY_COOKIES = true` en amplify-client-config.tsx
2. Limpia cookies y caché del navegador
3. Reinicia el servidor de desarrollo

### Si ves tokens en localStorage:
1. El flag no está activado correctamente
2. Necesitas cerrar sesión y volver a iniciar

### Para revertir a localStorage:
```bash
npm run test:cookie-migration -- --revert
```

## Logs de Confirmación

Cuando funcione correctamente, deberías ver en la consola del navegador:
- NO errores de Amplify
- NO warnings sobre cookies
- Los logs normales de autenticación

## ¡Importante!

Esta configuración es para **desarrollo**. Para producción necesitarás:
1. Configurar `NEXT_PUBLIC_COOKIE_DOMAIN` correctamente
2. Asegurar HTTPS en todos los endpoints
3. Actualizar los callbacks de OAuth en producción