# 🔧 Fix OAuth "Invalid state" - Callback URL Correcto

## ❌ **Problema Identificado**

El error "Invalid state" ocurría porque estábamos usando el callback URL incorrecto. Amazon Cognito espera `/oauth2/idpresponse` para el flujo OAuth con identity providers.

## ✅ **Solución Implementada**

### **1. Callback URL Correcto**
```
ANTES:  http://localhost:3000/auth
AHORA:  http://localhost:3000/oauth2/idpresponse
```

### **2. Flujo OAuth Corregido**
```
1. Usuario → Click "Continuar con Apple"
2. Amplify → signInWithRedirect({ provider: 'Apple' })
3. Cognito → Redirige a Apple con state válido
4. Apple → Autentica usuario
5. Apple → Devuelve a Cognito
6. Cognito → Redirige a /oauth2/idpresponse con code
7. /oauth2/idpresponse → Redirige a /auth
8. /auth → OAuth2Callback procesa el código
9. Usuario → Autenticado y redirigido a /dashboard
```

### **3. Archivos Modificados**

#### **amplify/outputs.json**
```json
"redirect_sign_in": "http://localhost:3000/oauth2/idpresponse,https://yaan.com.mx/oauth2/idpresponse"
```

#### **yaan-idp-stack.go (CDK)**
```go
CallbackUrls: &[]*string{
    jsii.String("http://localhost:3000/oauth2/idpresponse"),
    jsii.String("https://yaan.com.mx/oauth2/idpresponse"),
}
```

#### **Nuevo archivo: src/app/oauth2/idpresponse/page.tsx**
Endpoint que recibe el callback de Cognito y redirige a /auth con los parámetros.

## 🚀 **Próximos Pasos**

1. **Desplegar CDK actualizado**:
   ```bash
   cdk deploy YaanIdpStack
   ```

2. **Verificar en Cognito Console**:
   - User Pool → App clients → yaan-app-client-stack
   - Verificar que Callback URLs incluyan `/oauth2/idpresponse`

3. **Probar el flujo**:
   - Hacer click en "Continuar con Apple"
   - No más error "Invalid state"
   - Usuario autenticado exitosamente

## 📝 **Notas Importantes**

- El ejemplo de Amazon Cognito usa `react-oidc-context` que es diferente a Amplify
- Amplify maneja el flujo OAuth internamente pero necesita el callback URL correcto
- El endpoint `/oauth2/idpresponse` es un estándar de Cognito para identity providers
- Este cambio NO afecta el login con email/password, solo OAuth social

## 🔍 **Debugging**

Si aún hay problemas:
1. Verificar que el CDK esté desplegado
2. Confirmar URLs en Cognito Console
3. Revisar CloudTrail para ver el flujo completo
4. Verificar que Lambda Pre-SignUp auto-confirme usuarios