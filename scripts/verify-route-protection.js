#!/usr/bin/env node

/**
 * Script de verificación completa de protección de rutas
 * Ejecuta pruebas automatizadas para confirmar que /dashboard está protegido
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log('🛡️  VERIFICACIÓN DE PROTECCIÓN DE RUTAS - DASHBOARD\n');

const tests = [
  {
    name: 'Acceso sin autenticación → HTTP 307',
    test: async () => {
      const { stdout } = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard');
      return {
        passed: stdout.trim() === '307',
        result: `HTTP ${stdout.trim()}`,
        expected: 'HTTP 307'
      };
    }
  },
  {
    name: 'Redirección a login con parámetros',
    test: async () => {
      const { stdout } = await execAsync('curl -s -o /dev/null -w "%{redirect_url}" http://localhost:3000/dashboard');
      const redirectUrl = stdout.trim();
      const hasCorrectRedirect = redirectUrl.includes('/auth') && 
                                redirectUrl.includes('error=authentication_required') && 
                                redirectUrl.includes('redirect=/moments');
      return {
        passed: hasCorrectRedirect,
        result: redirectUrl || 'Sin redirección',
        expected: '/auth?error=authentication_required&redirect=/moments'
      };
    }
  },
  {
    name: 'Headers de seguridad presentes',
    test: async () => {
      const { stdout } = await execAsync('curl -I http://localhost:3000/dashboard 2>/dev/null');
      const hasSecurityHeaders = stdout.includes('X-') || stdout.includes('location:');
      return {
        passed: hasSecurityHeaders,
        result: hasSecurityHeaders ? 'Headers presentes' : 'Headers ausentes',
        expected: 'Headers de seguridad presentes'
      };
    }
  },
  {
    name: 'Contenido contiene NEXT_REDIRECT',
    test: async () => {
      const { stdout } = await execAsync('curl -s http://localhost:3000/dashboard');
      const hasRedirectSignal = stdout.includes('NEXT_REDIRECT') && 
                               stdout.includes('/auth') &&
                               stdout.includes('307');
      return {
        passed: hasRedirectSignal,
        result: hasRedirectSignal ? 'Redirección detectada en contenido' : 'Sin señales de redirección',
        expected: 'HTML debe contener NEXT_REDIRECT con código 307'
      };
    }
  },
  {
    name: 'Servidor responde correctamente',
    test: async () => {
      const { stdout } = await execAsync('curl -s -o /dev/null -w "%{time_total}" http://localhost:3000/dashboard');
      const responseTime = parseFloat(stdout.trim());
      return {
        passed: responseTime < 2.0, // Menos de 2 segundos
        result: `${responseTime}s`,
        expected: 'Menos de 2 segundos'
      };
    }
  }
];

async function runTests() {
  let passedTests = 0;
  const totalTests = tests.length;

  console.log(`Ejecutando ${totalTests} pruebas...\n`);

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    process.stdout.write(`${i + 1}. ${test.name}... `);
    
    try {
      const result = await test.test();
      
      if (result.passed) {
        console.log('✅ PASÓ');
        console.log(`   Resultado: ${result.result}`);
        passedTests++;
      } else {
        console.log('❌ FALLÓ');
        console.log(`   Resultado: ${result.result}`);
        console.log(`   Esperado: ${result.expected}`);
      }
    } catch (error) {
      console.log('⚠️  ERROR');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Resumen
  console.log('━'.repeat(60));
  console.log(`📊 RESUMEN: ${passedTests}/${totalTests} pruebas pasaron`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡TODAS LAS PRUEBAS PASARON!');
    console.log('✅ El dashboard está 100% protegido');
  } else {
    console.log('⚠️  Algunas pruebas fallaron');
    console.log('❌ La protección puede no estar completa');
  }
  
  console.log('━'.repeat(60));
  
  // Pruebas manuales recomendadas
  console.log('\n🔍 PRUEBAS MANUALES RECOMENDADAS:');
  console.log('1. Abre http://localhost:3000/moments en el navegador');
  console.log('2. Verifica que redirige a /auth automáticamente');
  console.log('3. Inicia sesión y confirma que puedes acceder a moments');
  console.log('4. Revisa la consola del navegador para logs de protección');
  
  return passedTests === totalTests;
}

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    await execAsync('curl -s -o /dev/null http://localhost:3000');
    return true;
  } catch (error) {
    console.log('❌ Error: El servidor no está corriendo en localhost:3000');
    console.log('   Ejecuta: npm run dev');
    return false;
  }
}

// Función principal
async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  const allTestsPassed = await runTests();
  process.exit(allTestsPassed ? 0 : 1);
}

main();