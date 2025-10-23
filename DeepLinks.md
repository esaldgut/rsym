# Implementación Completa de Deep Links para React Native y Expo: yaan.com.mx

## Resumen ejecutivo

Los Deep Links transforman enlaces web estándar en puntos de entrada directos a tu aplicación móvil. Esta guía profesional cubre la implementación end-to-end de **Android App Links** e **iOS Universal Links** para aplicaciones React Native desarrolladas con Expo, específicamente optimizada para **yaan.com.mx**. Las empresas que implementan deep linking correctamente observan incrementos de conversión de 2-3× y tasas de retención 40-60% superiores comparadas con flujos tradicionales.

---

## 1. CONFIGURACIÓN DEL SITIO WEB Y SERVIDOR

### Archivos requeridos en .well-known para yaan.com.mx

Tu dominio requiere dos archivos de verificación en el directorio `.well-known`:

```
https://yaan.com.mx/
├── .well-known/
│   ├── assetlinks.json                    # Android App Links
│   └── apple-app-site-association         # iOS Universal Links (sin extensión)
```

### Archivo assetlinks.json (Android)

**Ubicación**: `https://yaan.com.mx/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "mx.com.yaan.app",
    "sha256_cert_fingerprints": [
      "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"
    ]
  }
}]
```

**Obtener tu SHA-256 fingerprint**:
```bash
# Con EAS Build (recomendado)
eas credentials -p android

# O desde Google Play Console
# Play Console → Setup → App Integrity → SHA-256 certificate fingerprint
```

**Nota crítica**: Si usas Play App Signing, usa el certificado de Play Console, NO tu keystore local.

### Archivo apple-app-site-association (iOS)

**Ubicación**: `https://yaan.com.mx/.well-known/apple-app-site-association`  
**Sin extensión .json**

```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.mx.com.yaan.app",
      "paths": [
        "/producto/*",
        "/momentos/*",
        "/categorias/*",
        "NOT /admin/*",
        "*"
      ]
    }]
  },
  "webcredentials": {
    "apps": ["TEAM_ID.mx.com.yaan.app"]
  }
}
```

**TEAM_ID**: Encuéntralo en Apple Developer → Membership (10 caracteres)

### Configuración Apache (.htaccess)

```apache
# Habilitar rewrite engine
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Permitir .well-known
    RewriteCond %{REQUEST_URI} "!(^|/)\.well-known/([^./]+./?)+$" [NC]
    RewriteCond %{SCRIPT_FILENAME} -d [OR]
    RewriteCond %{SCRIPT_FILENAME} -f
    RewriteRule "(^|/)\." - [F]
    
    # Forzar HTTPS
    RewriteCond %{HTTPS} !=on
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</IfModule>

# Headers para archivos de verificación
<IfModule mod_headers.c>
    <FilesMatch "^(apple-app-site-association|assetlinks\.json)$">
        Header set Content-Type "application/json"
        Header set Cache-Control "max-age=3600, public"
        Header set Access-Control-Allow-Origin "*"
    </FilesMatch>
</IfModule>
```

### Configuración Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name yaan.com.mx www.yaan.com.mx;
    
    ssl_certificate /etc/ssl/certs/yaan.com.mx.crt;
    ssl_certificate_key /etc/ssl/private/yaan.com.mx.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    root /var/www/yaan.com.mx;
    
    # Apple App Site Association
    location = /.well-known/apple-app-site-association {
        alias /var/www/yaan.com.mx/.well-known/apple-app-site-association;
        default_type application/json;
        add_header Cache-Control "max-age=3600, public";
        add_header Access-Control-Allow-Origin "*";
    }
    
    # Android Asset Links
    location = /.well-known/assetlinks.json {
        alias /var/www/yaan.com.mx/.well-known/assetlinks.json;
        default_type application/json;
        add_header Cache-Control "max-age=3600, public";
        add_header Access-Control-Allow-Origin "*";
    }
}
```

### Headers HTTP obligatorios

| Header | Valor | Propósito |
|--------|-------|-----------|
| **Content-Type** | application/json | Requerido por iOS y Android |
| **Cache-Control** | max-age=3600, public | Permite CDN, reduce latencia |
| **Access-Control-Allow-Origin** | * | Permite validadores web |

### Requisitos SSL/TLS

- **HTTPS obligatorio** - Deep links NO funcionan sobre HTTP
- TLS 1.2 o superior
- Certificado válido sin errores
- Sin redirects durante descarga de archivos de verificación

**Obtener certificado gratuito**:
```bash
sudo certbot --nginx -d yaan.com.mx -d www.yaan.com.mx
```

---

## 2. ANDROID APP LINKS: GUÍA PASO A PASO

### Paso 1: Configurar app.json

```json
{
  "expo": {
    "name": "Yaan",
    "slug": "yaan-app",
    "scheme": "yaan",
    "android": {
      "package": "mx.com.yaan.app",
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{
          "scheme": "https",
          "host": "yaan.com.mx"
        }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}
```

**Campo crítico**: `"autoVerify": true` es obligatorio para evitar diálogo de selección.

### Paso 2: Obtener SHA-256 fingerprint

```bash
# Método EAS (recomendado)
eas build --platform android --profile production
eas credentials -p android

# Copiar SHA-256 Fingerprint y agregarlo a assetlinks.json
```

### Paso 3: Subir assetlinks.json

```bash
# Crear archivo
cat > assetlinks.json << 'EOF'
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "mx.com.yaan.app",
    "sha256_cert_fingerprints": ["TU_FINGERPRINT_AQUI"]
  }
}]
EOF

# Subir a servidor
scp assetlinks.json user@yaan.com.mx:/var/www/yaan.com.mx/.well-known/
```

### Paso 4: Verificar configuración

```bash
# Verificar accesibilidad
curl -I https://yaan.com.mx/.well-known/assetlinks.json

# Debe retornar:
# HTTP/2 200
# content-type: application/json

# Verificar con Google Digital Asset Links API
curl "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://yaan.com.mx&relation=delegate_permission/common.handle_all_urls"
```

### Paso 5: Testing en dispositivo

```bash
# Instalar app
adb install app-release.apk

# Verificar estado de App Links
adb shell pm get-app-links mx.com.yaan.app

# Debe mostrar: "verified" para yaan.com.mx

# Test de apertura
adb shell am start -a android.intent.action.VIEW \
    -d "https://yaan.com.mx/producto/123"
```

### Solución de problemas comunes

**Problema**: Estado muestra "none" o "legacy_failure"

**Solución**:
```bash
# 1. Resetear estado
adb shell pm set-app-links --package mx.com.yaan.app 0 all

# 2. Forzar re-verificación
adb shell pm verify-app-links --re-verify mx.com.yaan.app

# 3. Esperar 60 segundos y verificar
adb shell pm get-app-links mx.com.yaan.app
```

---

## 3. iOS UNIVERSAL LINKS: GUÍA PASO A PASO

### Paso 1: Configurar app.json

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "mx.com.yaan.app",
      "associatedDomains": [
        "applinks:yaan.com.mx",
        "applinks:www.yaan.com.mx"
      ]
    }
  }
}
```

**No incluir** `https://` en los dominios.

### Paso 2: Setup rápido con Expo

```bash
npx setup-safari
```

Este comando configura automáticamente tu App ID con Associated Domains.

### Paso 3: Subir apple-app-site-association

```bash
# Crear archivo (sin extensión .json)
cat > apple-app-site-association << 'EOF'
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAMID.mx.com.yaan.app",
      "paths": ["/producto/*", "/momentos/*", "*"]
    }]
  }
}
EOF

# Subir a servidor
scp apple-app-site-association user@yaan.com.mx:/var/www/yaan.com.mx/.well-known/
```

### Paso 4: Verificar con herramientas

```bash
# Branch.io validator (recomendado)
# Visitar: https://branch.io/resources/aasa-validator/
# Ingresar: https://yaan.com.mx

# Command line (macOS)
sudo swcutil dl -d yaan.com.mx
sudo swcutil verify -d yaan.com.mx -j ./apple-app-site-association

# Verificar CDN de Apple
curl https://app-site-association.cdn-apple.com/a/v1/yaan.com.mx
```

### Paso 5: Testing en dispositivo

**En iPhone/iPad**:
1. Abrir app Notas
2. Escribir: `https://yaan.com.mx/producto/123`
3. Salir del modo edición
4. Long-press en el link
5. Debe aparecer "Abrir en Yaan"

**Con CLI**:
```bash
npx uri-scheme open "https://yaan.com.mx/producto/123" --ios
```

---

## 4. IMPLEMENTACIÓN EN REACT NATIVE CON EXPO

### Configuración completa app.json

```json
{
  "expo": {
    "name": "Yaan",
    "slug": "yaan-app",
    "version": "1.0.0",
    "scheme": "yaan",
    "ios": {
      "bundleIdentifier": "mx.com.yaan.app",
      "associatedDomains": ["applinks:yaan.com.mx"]
    },
    "android": {
      "package": "mx.com.yaan.app",
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{"scheme": "https", "host": "yaan.com.mx"}],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}
```

### Tipos TypeScript

```typescript
// types/navigation.ts
export type RootStackParamList = {
  Home: undefined;
  ProductDetail: { id: string; from?: string };
  MomentDetail: { id: string; userId?: string };
  CategoryList: { categoryId: string };
  NotFound: { path: string };
};
```

### Configuración React Navigation

```typescript
// navigation/LinkingConfiguration.ts
import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'yaan://',
    'https://yaan.com.mx',
    'https://www.yaan.com.mx'
  ],
  config: {
    screens: {
      Home: '',
      ProductDetail: {
        path: 'producto/:id',
        parse: { id: (id: string) => id }
      },
      MomentDetail: {
        path: 'momentos/:id',
        parse: { id: (id: string) => id }
      },
      CategoryList: 'categorias/:categoryId',
      NotFound: '*'
    }
  },
  async getInitialURL() {
    return await Linking.getInitialURL();
  },
  subscribe(listener) {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });
    return () => subscription.remove();
  }
};
```

### Hook personalizado para deep linking

```typescript
// hooks/useDeepLinking.ts
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import Analytics from '../services/Analytics';

export const useDeepLinking = () => {
  const navigation = useNavigation();
  const url = Linking.useURL();

  useEffect(() => {
    if (url) handleDeepLink(url);
  }, [url]);

  const handleDeepLink = (deepUrl: string) => {
    try {
      const { path, queryParams } = Linking.parse(deepUrl);
      
      if (!path) return;

      // Log analytics
      Analytics.logEvent('deep_link_opened', {
        path,
        source: queryParams?.utm_source
      });

      // Navegar según path
      if (path.startsWith('producto/')) {
        const id = path.replace('producto/', '');
        navigation.navigate('ProductDetail', { 
          id, 
          from: queryParams?.utm_source as string
        });
      } else if (path.startsWith('momentos/')) {
        const id = path.replace('momentos/', '');
        navigation.navigate('MomentDetail', { id });
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  return { currentUrl: url };
};
```

### App.tsx completo

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { linking } from './navigation/LinkingConfiguration';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      console.log('App opened from:', initialUrl);
    }
    setIsReady(true);
  };

  if (!isReady) return null;

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="MomentDetail" component={MomentDetailScreen} />
        <Stack.Screen name="NotFound" component={NotFoundScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Pantalla de producto con deep link

```typescript
// screens/ProductDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const { id, from } = route.params;
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    const data = await ProductService.getById(id);
    setProduct(data);
    
    // Log analytics
    Analytics.logEvent('product_viewed', {
      product_id: id,
      source: from || 'direct'
    });
  };

  if (!product) return <ActivityIndicator />;

  return (
    <View>
      <Text>{product.name}</Text>
      <Text>${product.price}</Text>
      {from && <Text>Llegaste desde: {from}</Text>}
    </View>
  );
}
```

---

## 5. ESTRATEGIA DE RUTAS Y DEEP LINKING

### Patrones de URL para e-commerce

**URLs recomendadas para yaan.com.mx**:

```
https://yaan.com.mx/producto/123           # Detalle de producto
https://yaan.com.mx/producto/123?from=email # Con tracking
https://yaan.com.mx/momentos/456            # Momento específico
https://yaan.com.mx/categorias/ropa         # Lista de categoría
https://yaan.com.mx/buscar?q=vestidos       # Búsqueda
```

### Manejo de fallback (app no instalada)

**Smart Banner en web**:

```html
<!-- En <head> de yaan.com.mx -->
<meta name="apple-itunes-app" content="app-id=YOUR_IOS_APP_ID">

<script>
function showAppBanner() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isIOS || isAndroid) {
    // Guardar URL para deferred deep linking
    localStorage.setItem('yaanDeferredLink', JSON.stringify({
      url: window.location.href,
      timestamp: Date.now()
    }));
    
    document.getElementById('app-banner').style.display = 'block';
  }
}

function openApp() {
  window.location.href = window.location.href;
  
  setTimeout(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    window.location.href = isIOS 
      ? 'https://apps.apple.com/app/yaan/idYOUR_APP_ID'
      : 'https://play.google.com/store/apps/details?id=mx.com.yaan.app';
  }, 2500);
}

showAppBanner();
</script>
```

### Deferred deep linking

```typescript
// services/DeferredDeepLinkService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class DeferredDeepLinkService {
  static async isFirstOpen(): Promise<boolean> {
    const firstOpen = await AsyncStorage.getItem('@yaan:first_open');
    if (firstOpen === null) {
      await AsyncStorage.setItem('@yaan:first_open', 'false');
      return true;
    }
    return false;
  }

  static async processDeferredLink(): Promise<string | null> {
    try {
      const stored = await AsyncStorage.getItem('@yaan:deferred_link');
      if (stored) {
        const data = JSON.parse(stored);
        const age = Date.now() - data.timestamp;
        
        // Solo usar si tiene menos de 24 horas
        if (age < 24 * 60 * 60 * 1000) {
          await AsyncStorage.removeItem('@yaan:deferred_link');
          return data.url;
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}
```

### Patrones de URL con parámetros UTM

```typescript
// Ejemplo de URL completa con tracking
const productUrl = 
  'https://yaan.com.mx/producto/123' +
  '?utm_source=email' +
  '&utm_campaign=summer_sale' +
  '&utm_medium=newsletter' +
  '&utm_content=banner_hero';

// Parser que extrae parámetros
const { path, queryParams } = Linking.parse(productUrl);
// path: "producto/123"
// queryParams: { utm_source: "email", utm_campaign: "summer_sale", ... }
```

---

## 6. ARQUITECTURA AWS CON WELL-ARCHITECTED FRAMEWORK

### Arquitectura recomendada

```
Usuario → Route 53 → CloudFront → S3 (archivos verificación)
                   ↓
              Lambda@Edge (headers)
```

### Configuración S3

```bash
# Crear bucket
aws s3 mb s3://yaan-verification-files --region us-east-1

# Subir archivos
aws s3 cp apple-app-site-association \
  s3://yaan-verification-files/.well-known/apple-app-site-association \
  --content-type application/json \
  --cache-control "max-age=3600, public"

aws s3 cp assetlinks.json \
  s3://yaan-verification-files/.well-known/assetlinks.json \
  --content-type application/json \
  --cache-control "max-age=3600, public"
```

### Configuración CloudFront

**Crear distribución**:
```bash
aws cloudfront create-distribution --origin-domain-name yaan-verification-files.s3.amazonaws.com --default-root-object ""
```

**Configurar CNAME**:
- Alternate Domain Names: `yaan.com.mx`, `www.yaan.com.mx`
- SSL Certificate: Usar AWS Certificate Manager (ACM)

### Certificado SSL con ACM

```bash
# Solicitar certificado (DEBE ser us-east-1 para CloudFront)
aws acm request-certificate \
    --domain-name yaan.com.mx \
    --subject-alternative-names www.yaan.com.mx \
    --validation-method DNS \
    --region us-east-1
```

### Route 53

```bash
# Crear registro A apuntando a CloudFront
aws route53 change-resource-record-sets --hosted-zone-id ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "yaan.com.mx",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "d1234567890.cloudfront.net",
        "EvaluateTargetHealth": false
      }
    }
  }]
}'
```

### Lambda@Edge para headers

```javascript
exports.handler = async (event) => {
    const response = event.Records[0].cf.response;
    const uri = event.Records[0].cf.request.uri;
    
    if (uri.includes('apple-app-site-association') || uri.includes('assetlinks.json')) {
        response.headers['content-type'] = [{ value: 'application/json' }];
        response.headers['cache-control'] = [{ value: 'max-age=3600, public' }];
    }
    
    return response;
};
```

### Monitoreo CloudWatch

```bash
# Alarma para errores 4xx
aws cloudwatch put-metric-alarm \
    --alarm-name yaan-deep-links-errors \
    --metric-name 4xxErrorRate \
    --namespace AWS/CloudFront \
    --statistic Average \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold
```

### Estrategia de cache

- **TTL mínimo**: 1 hora
- **TTL máximo**: 24 horas
- **Invalidación**: Cuando actualices archivos

```bash
aws cloudfront create-invalidation \
    --distribution-id DIST_ID \
    --paths "/.well-known/*"
```

---

## 7. VERIFICACIÓN Y PRODUCCIÓN

### Verificación en Google Play Console

1. Play Console → Grow users → Deep links
2. Verificar estado "Verified" para yaan.com.mx
3. Test: Ingresar `https://yaan.com.mx/producto/123`

### Verificación en Apple Developer

```bash
# Branch.io validator
https://branch.io/resources/aasa-validator/?url=https://yaan.com.mx

# Apple CDN
curl https://app-site-association.cdn-apple.com/a/v1/yaan.com.mx
```

### Testing completo

```bash
#!/bin/bash
DOMAIN="yaan.com.mx"

echo "=== Testing Deep Links para $DOMAIN ==="

# Test 1: HTTPS accessibility
echo "[1] Testing HTTPS..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/.well-known/assetlinks.json)
[ $HTTP_CODE -eq 200 ] && echo "✓ assetlinks.json OK" || echo "✗ Error: $HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/.well-known/apple-app-site-association)
[ $HTTP_CODE -eq 200 ] && echo "✓ AASA OK" || echo "✗ Error: $HTTP_CODE"

# Test 2: Content-Type
echo "[2] Testing Content-Type..."
CONTENT_TYPE=$(curl -s -I https://$DOMAIN/.well-known/assetlinks.json | grep -i content-type)
echo $CONTENT_TYPE | grep -q "application/json" && echo "✓ Content-Type OK" || echo "✗ Content-Type incorrecto"

# Test 3: No redirects
echo "[3] Checking redirects..."
REDIRECTS=$(curl -s -o /dev/null -w "%{num_redirects}" https://$DOMAIN/.well-known/assetlinks.json)
[ $REDIRECTS -eq 0 ] && echo "✓ Sin redirects" || echo "✗ $REDIRECTS redirects"

# Test 4: Google DAL API
echo "[4] Testing Google API..."
curl -s "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://$DOMAIN&relation=delegate_permission/common.handle_all_urls" | grep -q "packageName" && echo "✓ Android verificado" || echo "✗ Android no verificado"

# Test 5: Apple CDN
echo "[5] Testing Apple CDN..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://app-site-association.cdn-apple.com/a/v1/$DOMAIN")
[ $HTTP_CODE -eq 200 ] && echo "✓ AASA en CDN Apple" || echo "⚠ No en CDN (puede tomar 24-48h)"

echo "=== Tests Complete ==="
```

### Entornos múltiples (dev/staging/production)

```javascript
// app.config.js
export default ({ config }) => {
  const env = process.env.APP_ENV || 'production';
  
  const domains = {
    development: 'dev.yaan.com.mx',
    staging: 'staging.yaan.com.mx',
    production: 'yaan.com.mx'
  };
  
  return {
    ...config,
    android: {
      package: `mx.com.yaan.app${env === 'production' ? '' : '.' + env}`,
      intentFilters: [{
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: domains[env] }],
        category: ['BROWSABLE', 'DEFAULT']
      }]
    },
    ios: {
      bundleIdentifier: `mx.com.yaan.app${env === 'production' ? '' : '.' + env}`,
      associatedDomains: [`applinks:${domains[env]}`]
    }
  };
};
```

---

## 8. MÉTRICAS Y KPIs

### KPIs críticos para medir

**Adquisición**:
- **Click-to-Install Rate**: (Instalaciones / Clicks) × 100 → Target: 20-40%
- **Deep Link Open Rate**: (Aperturas / Clicks) × 100 → Target: >90%

**Engagement**:
- **Conversion Rate**: (Conversiones / Aperturas) × 100 → Target: 2-3× vs orgánico
- **Session Duration**: Target 20-50% mayor vs tráfico directo
- **Bounce Rate**: Target <25%

**Técnicas**:
- **Success Rate**: (Exitosos / Intentos) × 100 → Target: >95%
- **Resolution Time**: Tiempo click→pantalla → Target: <2 segundos
- **Domain Verification**: Target: 100%

### Implementación Analytics

```typescript
// services/Analytics.ts
import * as Analytics from 'expo-firebase-analytics';

export class AnalyticsService {
  static logDeepLinkOpen(path: string, source?: string) {
    Analytics.logEvent('deep_link_opened', {
      path,
      utm_source: source || 'direct',
      platform: Platform.OS,
      timestamp: new Date().toISOString()
    });
  }

  static logConversion(productId: string, value: number, source?: string) {
    Analytics.logEvent('purchase', {
      product_id: productId,
      value,
      currency: 'MXN',
      source: source || 'direct'
    });
  }

  static logError(error: string, url: string) {
    Analytics.logEvent('deep_link_error', {
      error_type: error,
      url,
      platform: Platform.OS
    });
  }
}
```

### Dashboard recomendado

**Eventos a trackear**:
- `deep_link_clicked`: Click en link
- `deep_link_opened`: App abierta
- `deep_link_screen_reached`: Pantalla correcta mostrada
- `deep_link_conversion`: Acción completada
- `deep_link_error`: Error ocurrido

---

## 9. TROUBLESHOOTING

### Android: Links abren navegador

**Diagnóstico**:
```bash
adb shell pm get-app-links mx.com.yaan.app
```

**Si muestra "none" o "legacy_failure"**:
```bash
# Resetear y re-verificar
adb shell pm set-app-links --package mx.com.yaan.app 0 all
adb shell pm verify-app-links --re-verify mx.com.yaan.app
# Esperar 60 segundos
adb shell pm get-app-links mx.com.yaan.app
```

**Causas comunes**:
1. SHA-256 no coincide → Verificar Play Console certificate
2. assetlinks.json inaccesible → Verificar `curl https://yaan.com.mx/.well-known/assetlinks.json`
3. `autoVerify` no está en `true` → Revisar app.json

### iOS: Links abren Safari

**Diagnóstico**:
```bash
curl -I https://yaan.com.mx/.well-known/apple-app-site-association
# Debe retornar 200 con Content-Type: application/json

curl https://app-site-association.cdn-apple.com/a/v1/yaan.com.mx
# Debe retornar tu AASA file
```

**Causas comunes**:
1. AASA no accesible → Verificar HTTPS y headers
2. appID incorrecto → Verificar TEAM_ID.BUNDLE_ID
3. Usuario deshabilitó → Long-press link → "Abrir en App"

### Verificación completa de headers

```bash
# Verificar headers completos
curl -v https://yaan.com.mx/.well-known/assetlinks.json

# Debe incluir:
# < HTTP/2 200
# < content-type: application/json
# < cache-control: max-age=3600, public
```

---

## 10. CHECKLIST DE PRODUCCIÓN

### Pre-lanzamiento

- [ ] assetlinks.json creado con SHA-256 correcto
- [ ] apple-app-site-association creado con TEAM_ID correcto
- [ ] Archivos subidos a `/.well-known/` en yaan.com.mx
- [ ] HTTPS configurado con certificado válido
- [ ] Headers correctos (Content-Type: application/json)
- [ ] Sin redirects en archivos de verificación
- [ ] app.json configurado con intentFilters y associatedDomains
- [ ] `autoVerify: true` en Android
- [ ] Validado con Branch.io y Google DAL API

### Testing

- [ ] Testeado en dispositivo Android físico
- [ ] Testeado en dispositivo iOS físico
- [ ] Verificado con `adb shell pm get-app-links`
- [ ] Verificado en Apple CDN
- [ ] Testeado desde email, SMS, navegador
- [ ] Testeado app instalada y no instalada
- [ ] Analytics funcionando

### Post-lanzamiento

- [ ] Monitoreo de errores configurado
- [ ] Dashboard de métricas activo
- [ ] Documentación interna creada
- [ ] Plan de soporte definido

---

## Conclusión

La implementación exitosa de Deep Links requiere configuración precisa en tres áreas: **servidor web** (archivos de verificación con headers correctos), **configuración de apps** (intentFilters Android y associatedDomains iOS), e **implementación de código** (React Navigation linking con manejo robusto de URLs).

Para yaan.com.mx, los pasos críticos son:

1. **Subir archivos de verificación** con headers correctos sobre HTTPS
2. **Obtener certificados correctos** (SHA-256 para Android desde Play Console, TEAM_ID para iOS)
3. **Configurar app.json** con `autoVerify: true` y dominios correctos
4. **Implementar React Navigation linking** para manejar rutas
5. **Verificar** con herramientas oficiales antes de lanzar
6. **Monitorear** métricas post-lanzamiento

Los deep links incrementan conversiones 2-3× y mejoran retención 40-60%. La inversión en implementación correcta se recupera rápidamente con mejor engagement de usuarios.