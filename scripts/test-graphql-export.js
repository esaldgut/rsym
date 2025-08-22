#!/usr/bin/env node

// Script simple para verificar que executeGraphQLOperation se exporta correctamente
async function testExport() {
  try {
    const module = await import('../src/lib/graphql/server-client.ts');
    
    console.log('📦 Exported functions from server-client:');
    console.log(Object.keys(module).map(key => `  - ${key}`).join('\n'));
    
    if (module.executeGraphQLOperation) {
      console.log('✅ executeGraphQLOperation is properly exported');
      console.log('📝 Function type:', typeof module.executeGraphQLOperation);
    } else {
      console.log('❌ executeGraphQLOperation is NOT exported');
    }
    
  } catch (error) {
    console.error('💥 Error importing module:', error.message);
  }
}

testExport().catch(console.error);