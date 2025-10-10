// scripts/generate-types.ts
import { buildSchema, getIntrospectionQuery, graphql, parse } from 'graphql';
import { codegen } from '@graphql-codegen/core';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import * as typescriptOperationsPlugin from '@graphql-codegen/typescript-operations';
import * as fs from 'fs';
import * as path from 'path';

interface GenerateTypesOptions {
  schemaPath: string;
  outputPath: string;
  includeOperations?: boolean;
}

// Función para limpiar el schema de directivas de AWS
function cleanSchema(content: string): string {
  // 2. Remover TODAS las directivas de AWS
  const lines = content.split('\n');
  const cleanedLines: string[] = [];

  for (const line of lines) {
    let cleanedLine = line;

    // Saltar líneas de directivas completas
    if (line.trim().startsWith('directive @')) {
      continue;
    }

    // Remover directivas inline
    cleanedLine = cleanedLine
    .replace(/@aws_cognito_user_pools/g, '')
    .replace(/@aws_auth\([^)]*\)/g, '')
    .replace(/@connection\([^)]*\)/g, '')
    .replace(/@aws_[a-zA-Z_]+/g, '')
    .trim();

    // Solo agregar líneas no vacías
    if (cleanedLine !== '') {
      cleanedLines.push(cleanedLine);
    }
  }

  // 3. Corregir campos problemáticos (como cover_image_url)
  const finalContent = cleanedLines.join('\n')
  .replace(/cover_image_url\s*$/gm, 'cover_image_url: String') // Fix específico
  .replace(/(\w+)_url\s*$/gm, '$1_url: String') // Fix genérico para campos _url
  .replace(/(\w+)_id\s*$/gm, '$1_id: ID'); // Fix genérico para campos _id

  return finalContent + '\n';
}

export async function generateTypesFromSchema(options: GenerateTypesOptions) {
  const { schemaPath, outputPath, includeOperations = true } = options;

  console.log('🔄 Generando tipos TypeScript desde schema GraphQL...');

  try {
    // Leer y limpiar el schema
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const cleanedSchemaContent = cleanSchema(schemaContent);

    const schema = buildSchema(cleanedSchemaContent);

    // Configuración para el generador
    const config = {
      scalars: {
        ID: 'string',
        String: 'string',
        Boolean: 'boolean',
        Int: 'number',
        Float: 'number',
        AWSDate: 'string',
        AWSTime: 'string',
        AWSDateTime: 'string',
        AWSTimestamp: 'number',
        AWSEmail: 'string',
        AWSJSON: 'string',
        AWSURL: 'string',
        AWSPhone: 'string',
        AWSIPAddress: 'string',
      },
      enumsAsTypes: true,
      constEnums: true,
      futureProofEnums: true,
      maybeValue: 'T | null | undefined',
      inputMaybeValue: 'T | null | undefined',
      avoidOptionals: {
        field: false,
        inputValue: false,
        object: false,
        defaultValue: false,
      },
      nonOptionalTypename: true,
      skipTypename: false,
      exportFragmentSpreadSubTypes: true,
      dedupeFragments: true,
      preResolveTypes: true,
    };

    // Plugins a usar
    const plugins: Record<string, object>[] = [
      {
        typescript: {},
      },
    ];

    if (includeOperations) {
      plugins.push({
        'typescript-operations': {},
      });
    }

    // Generar código
    const output = await codegen({
      schema: parse(cleanedSchemaContent),
      documents: [],
      filename: outputPath,
      plugins,
      config,
      pluginMap: {
        typescript: typescriptPlugin,
        'typescript-operations': typescriptOperationsPlugin,
      },
    });

    // Escribir archivo
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, output);

    console.log(`✅ Tipos generados exitosamente en: ${outputPath}`);

    // Generar archivo de introspección
    const introspectionResult = await graphql({ schema, source: getIntrospectionQuery() });
    const introspectionPath = path.join(outputDir, 'introspection.json');
    fs.writeFileSync(introspectionPath, JSON.stringify(introspectionResult, null, 2));

    console.log(`✅ Introspección generada en: ${introspectionPath}`);

    return { success: true, outputPath, introspectionPath };

  } catch (error) {
    console.error('❌ Error generando tipos:', error);
    return { success: false, error };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateTypesFromSchema({
    schemaPath: 'schemas/schema.graphql',
    outputPath: 'src/generated/graphql.ts',
    includeOperations: true,
  });
}
