// scripts/extract-operations.ts
import { buildSchema, GraphQLSchema, isObjectType, isNonNullType, isListType, GraphQLType, isNamedType } from 'graphql';
import * as fs from 'fs';
import * as path from 'path';

interface Operation {
  name: string;
  type: 'query' | 'mutation' | 'subscription';
  args: Array<{ name: string; type: string; required: boolean }>;
  returnType: string;
}

export function extractOperationsFromSchema(schemaPath: string): Operation[] {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const schema = buildSchema(schemaContent);
  const operations: Operation[] = [];

  // Extract queries
  const queryType = schema.getQueryType();
  if (queryType && isObjectType(queryType)) {
    const fields = queryType.getFields();
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      operations.push({
        name: fieldName,
        type: 'query',
        args: field.args.map(arg => ({
          name: arg.name,
          type: getTypeString(arg.type),
          required: isNonNullType(arg.type)
        })),
        returnType: getTypeString(field.type)
      });
    });
  }

  // Extract mutations
  const mutationType = schema.getMutationType();
  if (mutationType && isObjectType(mutationType)) {
    const fields = mutationType.getFields();
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      operations.push({
        name: fieldName,
        type: 'mutation',
        args: field.args.map(arg => ({
          name: arg.name,
          type: getTypeString(arg.type),
          required: isNonNullType(arg.type)
        })),
        returnType: getTypeString(field.type)
      });
    });
  }

  // Extract subscriptions
  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType && isObjectType(subscriptionType)) {
    const fields = subscriptionType.getFields();
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      operations.push({
        name: fieldName,
        type: 'subscription',
        args: field.args.map(arg => ({
          name: arg.name,
          type: getTypeString(arg.type),
          required: isNonNullType(arg.type)
        })),
        returnType: getTypeString(field.type)
      });
    });
  }

  return operations;
}

function getTypeString(type: GraphQLType): string {
  if (isNonNullType(type)) {
    const innerType = getTypeString(type.ofType);
    return `${innerType}!`;
  }
  if (isListType(type)) {
    return `[${getTypeString(type.ofType)}]`;
  }
  if (isNamedType(type)) {
    return type.name;
  }
  return 'Unknown';
}

function getFieldSelection(typeName: string, schema: GraphQLSchema, depth: number = 0, visited: Set<string> = new Set()): string {
  // ✅ Profundidad máxima aumentada a 10
  if (depth > 10 || visited.has(typeName)) {
    return '';
  }

  visited.add(typeName);
  const type = schema.getType(typeName);

  if (!type || !isObjectType(type)) {
    return '';
  }

  const fields = type.getFields();
  const fieldSelections: string[] = [];
  const indent = '  '.repeat(depth + 2);

  // Check if type has id field
  const hasIdField = 'id' in fields;

  Object.keys(fields).forEach(fieldName => {
    const field = fields[fieldName];
    const fieldType = getBaseType(field.type);

    // Always include scalar fields
    if (isNamedType(fieldType) && isScalarType(fieldType.name)) {
      fieldSelections.push(`${indent}${fieldName}`);
    } else if (depth < 10 && isNamedType(fieldType)) {
      // ✅ Incluir hasta 10 niveles de objetos anidados
      const nestedSelection = getFieldSelection(fieldType.name, schema, depth + 1, new Set(visited));
      if (nestedSelection) {
        fieldSelections.push(`${indent}${fieldName} {${nestedSelection}\n${indent}}`);
      }
    }
  });

  // If no fields selected and type doesn't have id, try to get at least some fields
  if (fieldSelections.length === 0 && !hasIdField) {
    // For types without id, include all scalar fields at top level
    Object.keys(fields).slice(0, 5).forEach(fieldName => {
      const field = fields[fieldName];
      const fieldType = getBaseType(field.type);
      if (isNamedType(fieldType) && isScalarType(fieldType.name)) {
        fieldSelections.push(`${indent}${fieldName}`);
      }
    });
  }

  return fieldSelections.length > 0 ? '\n' + fieldSelections.join('\n') : '';
}

function getBaseType(type: GraphQLType): GraphQLType {
  if (isNonNullType(type) || isListType(type)) {
    return getBaseType(type.ofType);
  }
  return type;
}

function isScalarType(typeName: string): boolean {
  const scalars = ['String', 'Int', 'Float', 'Boolean', 'ID',
                   'AWSDate', 'AWSTime', 'AWSDateTime', 'AWSTimestamp',
                   'AWSEmail', 'AWSJSON', 'AWSURL', 'AWSPhone', 'AWSIPAddress'];
  return scalars.includes(typeName);
}

export function generateOperationFiles(operations: Operation[], outputDir: string, schemaPath: string) {
  const schema = buildSchema(fs.readFileSync(schemaPath, 'utf8'));

  // Create subdirectories
  const dirs = ['queries', 'mutations', 'subscriptions'];
  dirs.forEach(dir => {
    const dirPath = path.join(outputDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  operations.forEach(operation => {
    const operationContent = generateOperationContent(operation, schema);
    const subDir = operation.type === 'query' ? 'queries' :
                   operation.type === 'mutation' ? 'mutations' : 'subscriptions';
    const fileName = `${operation.name}.graphql`;
    const filePath = path.join(outputDir, subDir, fileName);

    fs.writeFileSync(filePath, operationContent);
  });

  console.log(`✅ ${operations.length} operaciones generadas en: ${outputDir}`);
}

function generateOperationContent(operation: Operation, schema: GraphQLSchema): string {
  const { name, type, args, returnType } = operation;

  // Build argument list
  let argList = '';
  let argValues = '';

  if (args.length > 0) {
    const argDeclarations = args.map(arg => {
      const varName = `$${arg.name}`;
      // Type already includes ! if required from getTypeString
      const varType = arg.type;
      return `${varName}: ${varType}`;
    });

    const argAssignments = args.map(arg => `${arg.name}: $${arg.name}`);

    argList = `(${argDeclarations.join(', ')})`;
    argValues = `(${argAssignments.join(', ')})`;
  }

  // Get field selection based on return type
  const cleanReturnType = returnType.replace(/[\[\]!]/g, '');
  let fieldSelection = '';

  if (cleanReturnType && !isScalarType(cleanReturnType)) {
    fieldSelection = getFieldSelection(cleanReturnType, schema);
  }

  // If no fields were selected or it's a scalar, use a minimal selection
  if (!fieldSelection) {
    if (isScalarType(cleanReturnType)) {
      // For scalar returns (like deleteProduct returning String)
      return `${type} ${name}${argList} {\n  ${name}${argValues}\n}`;
    } else {
      // Default to minimal fields for objects without proper field selection
      fieldSelection = '\n    __typename';
    }
  }

  return `${type} ${name}${argList} {\n  ${name}${argValues} {${fieldSelection}\n  }\n}`;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const operations = extractOperationsFromSchema('schemas/schema.graphql');
  generateOperationFiles(operations, 'src/graphql', 'schemas/schema.graphql');
}