# Configuración de Amplify

Este proyecto utiliza AWS Amplify **únicamente como librería cliente** para conectarse a recursos AWS provisionados externamente.

## Arquitectura

- **Provisionamiento de recursos**: AWS CDK Go v2 (repositorio separado)
- **Cliente web**: Next.js + Amplify Libraries
- **Configuración**: Un solo punto de verdad en `outputs.json`

## Flujo de configuración

1. El equipo de backend provisiona recursos con AWS CDK Go v2
2. Los outputs de CDK se vuelcan en `amplify/outputs.json`
3. La aplicación web importa `outputs.json` en `src/app/amplify-client-config.tsx`
4. Amplify se configura automáticamente con todos los recursos

## Estructura

```
amplify/
├── outputs.json          # 🎯 ÚNICO PUNTO DE VERDAD (generado por CDK)
├── backend.ts           # No usado para despliegue
├── data/                # Solo para referencia del esquema
└── README.md            # Este archivo
```

## NO hacer

- NO ejecutar `amplify push` o `amplify publish`
- NO ejecutar `npx ampx sandbox`
- NO crear recursos con Amplify CLI
- NO modificar manualmente `outputs.json`

## Actualizar configuración

Cuando el equipo de backend actualice recursos:
1. Recibir nuevo `outputs.json` del equipo de backend
2. Reemplazar `amplify/outputs.json`
3. Reiniciar la aplicación Next.js