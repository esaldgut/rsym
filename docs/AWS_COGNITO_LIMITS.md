# AWS Cognito Custom Attribute Limits

## Límite Crítico: 255 Caracteres

AWS Cognito impone un límite estricto de **255 caracteres** para todos los atributos personalizados (custom attributes). Este límite incluye cualquier serialización JSON.

## Problema Identificado

### Error Original
```
InvalidParameterException: user.custom:company_profile: String must be no longer than 255 characters
```

### Causa Raíz
El campo `company_profile` estaba siendo serializado como JSON con un objeto wrapper:
```javascript
// ANTES (causaba error):
attributesToUpdate['custom:company_profile'] = JSON.stringify({
  description: data.company_profile
});
// Resultado: '{"description":"texto del usuario"}' - caracteres extras por el JSON
```

## Soluciones Implementadas

### 1. Campos de Texto Largo (company_profile, details)
- **Límite aplicado**: 250 caracteres (margen de seguridad)
- **Formato**: String directo sin JSON wrapper
- **Validación**: Cliente y servidor
- **UI**: Contador de caracteres en tiempo real

### 2. Campos JSON Optimizados
Para campos que requieren JSON, se optimizaron las claves:

#### contact_information / emgcy_details
```javascript
// ANTES (claves largas):
{
  "contact_name": "Juan Pérez",
  "contact_phone": "+52 555 123 4567",
  "contact_email": "juan@example.com"
}

// DESPUÉS (claves cortas):
{
  "n": "Juan Pérez",
  "p": "+52 555 123 4567",
  "e": "juan@example.com"
}
```

### 3. Compatibilidad Hacia Atrás
El cliente maneja ambos formatos automáticamente:
```typescript
if ('n' in parsed.data) {
  // Formato nuevo con claves cortas
  return {
    contact_name: parsed.data.n,
    contact_phone: parsed.data.p,
    contact_email: parsed.data.e
  };
} else {
  // Formato antiguo con claves completas
  return parsed.data;
}
```

## Campos Afectados y Sus Límites

| Campo | Tipo | Límite | Solución |
|-------|------|---------|----------|
| custom:company_profile | String | 250 chars | Truncado + validación |
| custom:details | String | 250 chars | Truncado + validación |
| custom:contact_information | JSON | 255 chars total | Claves optimizadas |
| custom:emgcy_details | JSON | 255 chars total | Claves optimizadas |
| custom:social_media_plfms | JSON Array | 255 chars total | Sin cambios (pequeño) |
| custom:days_of_service | JSON Array | 255 chars total | Sin cambios (pequeño) |
| custom:address | JSON | 255 chars total | Claves ya optimizadas |

## Validaciones Implementadas

### Server-Side (profile-settings-actions.ts)
```typescript
// Validación de longitud
if (data.company_profile && data.company_profile.length > 250) {
  errors.company_profile = 'El perfil de empresa no puede exceder 250 caracteres';
}

// Truncado como seguridad adicional
const maxLength = 250;
const truncatedProfile = data.company_profile.length > maxLength
  ? data.company_profile.substring(0, maxLength)
  : data.company_profile;
```

### Client-Side (profile-client.tsx)
```typescript
// Límite en onChange
onChange={(e) => {
  const value = e.target.value.slice(0, 250);
  updateFormData('company_profile', value);
}}

// Atributo HTML maxLength
maxLength={250}

// Contador visual
<span>({formData.company_profile?.length || 0}/250 caracteres)</span>
```

## Recomendaciones

### Para Nuevos Campos
1. **Texto simple**: Usar string directo, nunca JSON wrapper
2. **Límite seguro**: 250 caracteres máximo (deja margen)
3. **Validación doble**: Cliente y servidor
4. **UI clara**: Mostrar contador de caracteres

### Para Campos JSON
1. **Claves cortas**: Usar abreviaciones de 1-2 caracteres
2. **Valores mínimos**: Evitar valores por defecto largos
3. **Compresión**: Considerar base64 o codificación binaria para arrays grandes

### Monitoreo
1. **Logs de error**: Capturar InvalidParameterException
2. **Métricas**: Trackear campos que se acercan al límite
3. **Alertas**: Notificar si un campo supera 240 caracteres

## Testing

### Casos de Prueba Críticos
1. **Texto máximo**: Ingresar exactamente 250 caracteres
2. **Overflow**: Intentar pegar más de 250 caracteres
3. **Caracteres especiales**: Emojis y caracteres unicode
4. **JSON complejo**: Múltiples campos anidados
5. **Dispositivos móviles**: Validar en iPhone/Android

## Referencias
- [AWS Cognito User Pool Attributes](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html)
- [Custom Attributes Limits](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html#user-pool-settings-custom-attributes)

---

Última actualización: 2025-10-11
Problema reportado y resuelto: Error al guardar perfil de provider desde iPhone