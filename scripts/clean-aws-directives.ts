// scripts/clean-aws-directives.ts
import * as fs from 'fs';

export function cleanAWSDirectives(schemaPath: string): string {
  const content = fs.readFileSync(schemaPath, 'utf8');

  let cleanedContent = content;

  // 1. Eliminar SOLO directivas de definición (directive @xxx)
  cleanedContent = cleanedContent.replace(/^\s*directive @.*$/gm, '');

  // 2. Eliminar directivas inline AWS PRESERVANDO el resto de la línea
  // IMPORTANTE: No usar \s* al final para evitar eliminar saltos de línea
  cleanedContent = cleanedContent.replace(/@aws_cognito_user_pools/g, '');
  cleanedContent = cleanedContent.replace(/@aws_auth\([^)]*\)/g, '');
  cleanedContent = cleanedContent.replace(/@aws_subscribe\([^)]*\)/g, '');
  cleanedContent = cleanedContent.replace(/@connection\([^)]*\)/g, '');
  cleanedContent = cleanedContent.replace(/@aws_[a-zA-Z_]+\([^)]*\)/g, '');
  cleanedContent = cleanedContent.replace(/@aws_[a-zA-Z_]+/g, '');

  // 3. Limpiar espacios múltiples (pero NO tocar estructura)
  cleanedContent = cleanedContent.replace(/  +/g, ' ');

  // 4. Agregar escalares AWS si no existen
  if (!cleanedContent.includes('scalar AWSDate')) {
    cleanedContent += '\n\n# AWS Scalars\n';
    cleanedContent += 'scalar AWSDate\n';
    cleanedContent += 'scalar AWSTime\n';
    cleanedContent += 'scalar AWSDateTime\n';
    cleanedContent += 'scalar AWSTimestamp\n';
    cleanedContent += 'scalar AWSEmail\n';
    cleanedContent += 'scalar AWSJSON\n';
    cleanedContent += 'scalar AWSURL\n';
    cleanedContent += 'scalar AWSPhone\n';
    cleanedContent += 'scalar AWSIPAddress\n';
  }

  return cleanedContent;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  // ✅ CORREGIDO: Leer schema-raw.graphql en lugar de schema.graphql
  const cleaned = cleanAWSDirectives('schemas/schema-raw.graphql');
  fs.writeFileSync('schemas/schema-cleaned.graphql', cleaned);
  console.log('✅ Schema limpiado: schemas/schema-cleaned.graphql');
}
