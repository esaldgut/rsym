#!/usr/bin/env node

/**
 * Script para probar la migración a cookies HTTP-only
 * Uso: npm run test:cookie-migration
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'src/app/amplify-client-config.tsx');

console.log('🧪 Script de prueba de migración a cookies HTTP-only\n');

// Función para cambiar el flag de cookies
function setCookieFlag(value: boolean) {
  const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
  const newContent = content.replace(
    /const USE_HTTP_ONLY_COOKIES = \w+;/,
    `const USE_HTTP_ONLY_COOKIES = ${value};`
  );
  fs.writeFileSync(CONFIG_FILE, newContent);
  console.log(`✅ USE_HTTP_ONLY_COOKIES establecido a: ${value}`);
}

// Función para verificar el entorno
function checkEnvironment() {
  console.log('📋 Verificando entorno...\n');
  
  // Verificar dependencias
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const requiredDeps = ['@aws-amplify/adapter-nextjs', 'aws-amplify'];
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: NO INSTALADO`);
      return false;
    }
  }
  
  // Verificar archivos necesarios
  const requiredFiles = [
    'src/app/amplify-config-ssr.ts',
    'src/utils/amplify-server-utils.ts',
    'src/middleware.ts'
  ];
  
  console.log('\n📁 Verificando archivos...\n');
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} NO EXISTE`);
      return false;
    }
  }
  
  return true;
}

// Función principal
async function main() {
  // 1. Verificar entorno
  if (!checkEnvironment()) {
    console.log('\n❌ El entorno no está listo para la migración');
    process.exit(1);
  }
  
  console.log('\n✅ Entorno verificado correctamente');
  
  // 2. Crear backup del estado actual
  const backupContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
  
  try {
    // 3. Activar cookies HTTP-only
    console.log('\n🔄 Activando cookies HTTP-only...');
    setCookieFlag(true);
    
    // 4. Construir el proyecto
    console.log('\n🏗️  Construyendo el proyecto...');
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('\n✅ Construcción exitosa con cookies HTTP-only');
    
    // 5. Instrucciones para pruebas
    console.log('\n📝 Próximos pasos para probar:');
    console.log('1. Ejecuta: npm run dev');
    console.log('2. Abre las herramientas de desarrollo del navegador');
    console.log('3. Ve a la pestaña Application/Storage > Cookies');
    console.log('4. Inicia sesión y verifica que las cookies se crean');
    console.log('5. Verifica que las cookies tienen el flag HttpOnly');
    console.log('6. Intenta acceder a localStorage - no deberían existir tokens');
    
    console.log('\n⚠️  Para revertir los cambios, ejecuta:');
    console.log('npm run test:cookie-migration -- --revert');
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    // Restaurar backup
    fs.writeFileSync(CONFIG_FILE, backupContent);
    console.log('↩️  Configuración restaurada al estado anterior');
    process.exit(1);
  }
}

// Manejar argumentos
if (process.argv.includes('--revert')) {
  console.log('↩️  Revirtiendo a localStorage...');
  setCookieFlag(false);
  console.log('✅ Revertido exitosamente');
} else {
  main();
}