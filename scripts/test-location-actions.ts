#!/usr/bin/env tsx

/**
 * Script para probar las location-actions actualizadas con credenciales autenticadas
 */

import { searchPlacesByText } from '@/lib/server/location-actions';

async function testLocationSearch() {
  console.log('🚀 Probando location-actions con credenciales autenticadas...\n');
  
  try {
    console.log('📍 Realizando búsqueda de "Mexico City"...');
    const result = await searchPlacesByText('Mexico City');
    
    if (result.success) {
      console.log('✅ Búsqueda exitosa!');
      console.log(`📊 Resultados encontrados: ${result.locations?.length || 0}`);
      
      if (result.locations && result.locations.length > 0) {
        const firstLocation = result.locations[0];
        console.log('\n📍 Primer resultado:');
        console.log(`   Place: ${firstLocation.place}`);
        console.log(`   PlaceSub: ${firstLocation.placeSub}`);
        console.log(`   Coordinates: ${firstLocation.coordinates}`);
      }
    } else {
      console.log('❌ Error en la búsqueda:');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error: any) {
    console.log('💥 Error inesperado:');
    console.log(`   ${error.name}: ${error.message}`);
    
    if (error.message.includes('ID Token')) {
      console.log('\n🔐 Problema de autenticación:');
      console.log('   - Este test requiere un usuario autenticado');
      console.log('   - Ejecuta desde un contexto de Next.js con sesión activa');
      console.log('   - O prueba desde el dashboard después de hacer login');
    }
    
    if (error.name === 'AccessDeniedException') {
      console.log('\n🚫 Problema de permisos:');
      console.log('   - Verifica los permisos IAM en AWS Console');
      console.log('   - Aplica la política IAM del archivo docs/aws-location-iam-policy.json');
      console.log('   - Asegúrate de que el rol autenticado tenga acceso a AWS Location');
    }
  }
}

if (require.main === module) {
  testLocationSearch().catch(console.error);
}

export { testLocationSearch };