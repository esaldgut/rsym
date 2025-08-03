# 🍎 Solución para Apple Sign In - Atributos Requeridos

## ❌ **Problema Identificado**

**Error**: `attributes required: [given_name, family_name]`

**Causa**: Apple Sign In solo envía el nombre del usuario en el primer login. En logins subsecuentes, Apple no envía esta información por privacidad.

## 🔧 **Soluciones Disponibles**

### **Solución 1: Modificar User Pool (No recomendado)**
Hacer que `given_name` y `family_name` no sean requeridos. Esto afectaría todos los tipos de registro.

### **Solución 2: Lambda Pre-SignUp Trigger (Recomendado)**

Crear una función Lambda que intercepte el registro de Apple y proporcione valores por defecto:

```javascript
exports.handler = async (event) => {
  // Solo para proveedores sociales
  if (event.triggerSource === 'PreSignUp_ExternalProvider') {
    const { userAttributes } = event.request;
    
    // Si es Apple y faltan atributos
    if (event.userName.startsWith('SignInWithApple_')) {
      // Proporcionar valores por defecto si faltan
      if (!userAttributes.given_name) {
        event.response.userAttributes.given_name = 'Apple';
      }
      if (!userAttributes.family_name) {
        event.response.userAttributes.family_name = 'User';
      }
      
      // Auto-confirmar usuario social
      event.response.autoConfirmUser = true;
      event.response.autoVerifyEmail = true;
    }
  }
  
  return event;
};
```

### **Solución 3: Mapeo Alternativo en CDK**

Actualizar el mapeo para usar valores por defecto:

```go
AttributeMapping: &map[string]*string{
    "email":       jsii.String("email"),
    "family_name": jsii.String("email"), // Usar email como fallback
    "given_name":  jsii.String("email"), // Usar email como fallback
    "username":    jsii.String("sub"),
},
```

### **Solución 4: Actualizar Aplicación Web**

Después del login con Apple, solicitar al usuario que complete su perfil:

```typescript
// En OAuth2Callback.tsx
const attributes = await fetchUserAttributes();

// Si faltan atributos requeridos
if (!attributes.given_name || !attributes.family_name) {
  // Redirigir a página de completar perfil
  router.push('/complete-profile');
}
```

## 🚀 **Implementación Rápida (Temporal)**

### **Opción A: Modificar el mapeo en Cognito Console**

1. Ir a AWS Cognito Console
2. User Pool → Identity providers → SignInWithApple
3. Editar Attribute mapping:
   - given_name → email (temporal)
   - family_name → email (temporal)

### **Opción B: Usar Pre Token Generation Lambda existente**

Ya tienes configurado `cognito-mongodb-synchronization` como Pre Token Generation. Puedes modificarlo para manejar este caso:

```javascript
// En tu Lambda existente
if (event.triggerSource === 'TokenGeneration_HostedAuth') {
  const { userAttributes } = event.request;
  
  // Si faltan atributos requeridos
  if (!userAttributes['given_name'] || !userAttributes['family_name']) {
    // Extraer del email o proporcionar valores por defecto
    const emailParts = userAttributes.email.split('@')[0].split('.');
    
    event.response.claimsOverrideDetails = {
      claimsToAddOrOverride: {
        given_name: userAttributes['given_name'] || emailParts[0] || 'User',
        family_name: userAttributes['family_name'] || emailParts[1] || 'Apple'
      }
    };
  }
}
```

## ✅ **Solución Recomendada a Largo Plazo**

1. **Implementar Pre-SignUp Lambda Trigger** específico para manejar proveedores sociales
2. **Actualizar UI** para solicitar información faltante después del primer login
3. **Considerar** hacer opcionales estos campos para usuarios sociales

## 🎯 **Pasos Inmediatos**

1. **Temporal**: Modificar mapeo en Cognito Console para usar email como fallback
2. **Verificar**: Que el login funcione con este mapeo temporal
3. **Planificar**: Implementación de Lambda trigger para solución permanente

El problema es común con Apple Sign In y requiere manejo especial debido a sus políticas de privacidad.