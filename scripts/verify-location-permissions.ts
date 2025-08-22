#!/usr/bin/env tsx

/**
 * Script para verificar permisos de AWS Location Service
 * Verifica tanto credenciales autenticadas como no autenticadas
 */

import { LocationClient, SearchPlaceIndexForTextCommand, ListPlaceIndexesCommand } from '@aws-sdk/client-location';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import outputs from '../amplify/outputs.json';

interface VerificationResult {
  test: string;
  success: boolean;
  error?: string;
  details?: any;
}

async function verifyUnauthenticatedAccess(): Promise<VerificationResult> {
  console.log('🔍 [Test 1] Verificando acceso NO autenticado...');
  
  try {
    const client = new LocationClient({
      region: outputs.auth.aws_region,
      credentials: fromCognitoIdentityPool({
        identityPoolId: outputs.auth.identity_pool_id,
        clientConfig: { region: outputs.auth.aws_region }
      })
    });

    const command = new SearchPlaceIndexForTextCommand({
      IndexName: 'YAANPlaceIndex',
      Text: 'test search',
      MaxResults: 1
    });

    const response = await client.send(command);
    
    return {
      test: 'Unauthenticated Access',
      success: true,
      details: { resultsCount: response.Results?.length || 0 }
    };
    
  } catch (error: any) {
    return {
      test: 'Unauthenticated Access',
      success: false,
      error: error.name || 'UnknownError',
      details: {
        message: error.message,
        fault: error.$fault
      }
    };
  }
}

async function verifyAuthenticatedAccess(): Promise<VerificationResult> {
  console.log('🔍 [Test 2] Verificando acceso con token simulado...');
  
  try {
    // Simular token JWT (en producción vendría de Cognito)
    const mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'; // Token mock para prueba
    
    const client = new LocationClient({
      region: outputs.auth.aws_region,
      credentials: fromCognitoIdentityPool({
        identityPoolId: outputs.auth.identity_pool_id,
        logins: {
          [`cognito-idp.${outputs.auth.aws_region}.amazonaws.com/${outputs.auth.user_pool_id}`]: mockIdToken
        },
        clientConfig: { region: outputs.auth.aws_region }
      })
    });

    const command = new SearchPlaceIndexForTextCommand({
      IndexName: 'YAANPlaceIndex',
      Text: 'test search with auth',
      MaxResults: 1
    });

    const response = await client.send(command);
    
    return {
      test: 'Authenticated Access (Mock)',
      success: true,
      details: { resultsCount: response.Results?.length || 0 }
    };
    
  } catch (error: any) {
    return {
      test: 'Authenticated Access (Mock)',
      success: false,
      error: error.name || 'UnknownError',
      details: {
        message: error.message,
        fault: error.$fault
      }
    };
  }
}

async function listPlaceIndexes(): Promise<VerificationResult> {
  console.log('🔍 [Test 3] Listando Place Indexes disponibles...');
  
  try {
    const client = new LocationClient({
      region: outputs.auth.aws_region,
      credentials: fromCognitoIdentityPool({
        identityPoolId: outputs.auth.identity_pool_id,
        clientConfig: { region: outputs.auth.aws_region }
      })
    });

    const command = new ListPlaceIndexesCommand({
      MaxResults: 10
    });

    const response = await client.send(command);
    
    return {
      test: 'List Place Indexes',
      success: true,
      details: {
        indexes: response.Entries?.map(entry => ({
          name: entry.IndexName,
          description: entry.Description,
          dataSource: entry.DataSource
        })) || []
      }
    };
    
  } catch (error: any) {
    return {
      test: 'List Place Indexes',
      success: false,
      error: error.name || 'UnknownError',
      details: {
        message: error.message,
        fault: error.$fault
      }
    };
  }
}

async function checkConfiguration(): Promise<VerificationResult> {
  console.log('🔍 [Test 4] Verificando configuración de Amplify...');
  
  try {
    const requiredConfig = {
      auth_region: outputs.auth.aws_region,
      user_pool_id: outputs.auth.user_pool_id,
      user_pool_client_id: outputs.auth.user_pool_client_id,
      identity_pool_id: outputs.auth.identity_pool_id,
      unauthenticated_enabled: outputs.auth.unauthenticated_identities_enabled
    };

    const missingConfig = Object.entries(requiredConfig)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    if (missingConfig.length > 0) {
      return {
        test: 'Configuration Check',
        success: false,
        error: 'Missing Configuration',
        details: { missing: missingConfig }
      };
    }

    return {
      test: 'Configuration Check',
      success: true,
      details: requiredConfig
    };
    
  } catch (error: any) {
    return {
      test: 'Configuration Check',
      success: false,
      error: error.message,
      details: {}
    };
  }
}

async function main() {
  console.log('🚀 Iniciando verificación de permisos de AWS Location Service\n');
  console.log('📋 Configuración:');
  console.log(`   Region: ${outputs.auth.aws_region}`);
  console.log(`   Identity Pool: ${outputs.auth.identity_pool_id}`);
  console.log(`   User Pool: ${outputs.auth.user_pool_id}`);
  console.log(`   Place Index: YAANPlaceIndex`);
  console.log(`   Unauthenticated Enabled: ${outputs.auth.unauthenticated_identities_enabled}\n`);

  const tests = [
    checkConfiguration,
    listPlaceIndexes,
    verifyUnauthenticatedAccess,
    verifyAuthenticatedAccess
  ];

  const results: VerificationResult[] = [];

  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
      
      if (result.success) {
        console.log(`✅ ${result.test}: SUCCESS`);
        if (result.details) {
          console.log(`   Details:`, JSON.stringify(result.details, null, 2));
        }
      } else {
        console.log(`❌ ${result.test}: FAILED`);
        console.log(`   Error: ${result.error}`);
        if (result.details) {
          console.log(`   Details:`, JSON.stringify(result.details, null, 2));
        }
      }
      console.log('');
      
    } catch (error) {
      console.log(`💥 ${test.name}: CRASHED`);
      console.log(`   Error:`, error);
      console.log('');
    }
  }

  // Resumen
  console.log('📊 RESUMEN:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`   ✅ Exitosos: ${successful}`);
  console.log(`   ❌ Fallidos: ${failed}`);
  console.log(`   📈 Total: ${results.length}\n`);

  // Diagnóstico
  if (failed > 0) {
    console.log('🔧 RECOMENDACIONES:');
    
    const hasAccessDenied = results.some(r => r.error === 'AccessDeniedException');
    if (hasAccessDenied) {
      console.log('   1. ❌ AccessDeniedException detectado:');
      console.log('      - Verifica los permisos IAM del Identity Pool');
      console.log('      - Asegúrate de que el rol tenga acceso a geo:SearchPlaceIndexForText');
      console.log('      - Verifica el nombre del Place Index (YAANPlaceIndex)');
    }

    const hasResourceNotFound = results.some(r => r.error === 'ResourceNotFoundException');
    if (hasResourceNotFound) {
      console.log('   2. ❌ ResourceNotFoundException detectado:');
      console.log('      - El Place Index "YAANPlaceIndex" no existe');
      console.log('      - Verifica que esté creado en la región us-west-2');
      console.log('      - Verifica el nombre exacto del recurso');
    }

    console.log('   3. 🔐 Soluciones de permisos:');
    console.log('      - Configurar IAM roles en AWS Console');
    console.log('      - Habilitar acceso autenticado al Place Index');
    console.log('      - Verificar políticas de Identity Pool\n');
  }

  if (successful === results.length) {
    console.log('🎉 ¡Todos los permisos están configurados correctamente!');
  } else {
    console.log('⚠️  Hay problemas de configuración que necesitan ser resueltos.');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as verifyLocationPermissions };