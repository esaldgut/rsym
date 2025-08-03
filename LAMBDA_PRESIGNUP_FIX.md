# 🔧 Fix Lambda Pre-SignUp para Auto-Confirmación Social

## ❌ **Problema Identificado**

El usuario se crea correctamente en Cognito pero queda en estado **"Unconfirmed"**, causando el error genérico de Cognito.

**Causa**: Los usuarios que se registran vía proveedores sociales (Apple, Google, Facebook) no se auto-confirman automáticamente.

## ✅ **Solución: Actualizar Lambda Pre-SignUp**

### **Código que necesitas agregar a tu Lambda `cognito-mongodb-synchronization`:**

```javascript
exports.handler = async (event) => {
    console.log('Lambda trigger event:', JSON.stringify(event, null, 2));
    
    // Auto-confirmar usuarios de proveedores sociales
    if (event.triggerSource === 'PreSignUp_ExternalProvider') {
        console.log('Auto-confirming social provider user');
        
        // Auto-confirmar usuario
        event.response.autoConfirmUser = true;
        
        // Auto-verificar email si está presente
        if (event.request.userAttributes.email) {
            event.response.autoVerifyEmail = true;
        }
        
        // Auto-verificar teléfono si está presente
        if (event.request.userAttributes.phone_number) {
            event.response.autoVerifyPhone = true;
        }
    }
    
    // Tu lógica existente para MongoDB sync...
    // ...
    
    return event;
};
```

### **Trigger Sources para Social Login:**
- `PreSignUp_ExternalProvider`: Usuario registrándose vía proveedor externo (Apple, Google, Facebook)
- `PreSignUp_AdminCreateUser`: Usuario creado por admin
- `PreSignUp_SignUp`: Usuario registrándose directamente

## 🚀 **Implementación Inmediata**

### **Opción A: Actualizar Lambda Existente**
1. Ve a AWS Lambda Console
2. Encuentra la función `cognito-mongodb-synchronization`
3. Agrega el código de auto-confirmación al inicio
4. Deploy la función

### **Opción B: Confirmación Manual (Temporal)**
```bash
# Via AWS CLI
aws cognito-idp admin-confirm-sign-up \
    --user-pool-id us-west-2_S0R408BOa \
    --username SignInWithApple_000728.dfb77b6c41764ca6a96b05e1b2f12a99.2254
```

### **Opción C: Via AWS Console (Más rápido para testing)**
1. Ve a Cognito Console → Users
2. Encuentra el usuario `SignInWithApple_000728...`
3. Actions → Confirm user
4. Intenta el login nuevamente

## 🔍 **Verificación**

Después de implementar la solución:

1. **Borra el usuario actual** que está en estado Unconfirmed
2. **Intenta el login con Apple nuevamente**
3. **Verifica** que el nuevo usuario se cree en estado "Confirmed"
4. **Confirma** que el redirect a tu app funciona

## 📋 **Lambda Code Template Completo**

```javascript
exports.handler = async (event) => {
    console.log('Cognito trigger event:', JSON.stringify(event, null, 2));
    
    try {
        // Auto-confirmación para proveedores sociales
        if (event.triggerSource === 'PreSignUp_ExternalProvider') {
            console.log('Processing external provider signup');
            
            // Auto-confirmar usuario social
            event.response.autoConfirmUser = true;
            event.response.autoVerifyEmail = true;
            
            // Log para debugging
            console.log('Auto-confirmed social user:', event.request.userAttributes.email);
        }
        
        // Tu lógica de MongoDB sync existente aquí...
        if (event.triggerSource === 'PostAuthentication_Authentication' || 
            event.triggerSource === 'TokenGeneration_HostedAuth') {
            // Tu código de sync con MongoDB
        }
        
    } catch (error) {
        console.error('Lambda error:', error);
        // No lanzar error para no bloquear el registro
    }
    
    return event;
};
```

## 🎯 **Resultado Esperado**

Después de esta corrección:
- ✅ Usuario se crea en estado "Confirmed" automáticamente
- ✅ No más error genérico de Cognito
- ✅ Redirect automático a tu aplicación funciona
- ✅ Usuario puede acceder inmediatamente al dashboard