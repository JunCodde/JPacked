/**
 * Schema encoding/decoding utilities
 * Supports nested schema format: schema{id,profile{email,settings{theme}}}
 */

import type { SchemaField } from '../types';

/**
 * Extracts nested schema from an object
 */
export function extractNestedSchema(obj: Record<string, any>): SchemaField[] {
  const schema: SchemaField[] = [];
  
  for (const key in obj) {
    const value = obj[key];
    
    if (value === null || value === undefined) {
      schema.push({ name: key, isArray: false });
    } else if (Array.isArray(value)) {
      // Array field
      if (value.length > 0) {
        // Check if all items are objects of the same structure
        const firstItem = value[0];
        if (typeof firstItem === 'object' && !Array.isArray(firstItem) && firstItem !== null) {
          // Check if all items are objects (for flattening)
          const allObjects = value.every(item => 
            item !== null && 
            item !== undefined && 
            typeof item === 'object' && 
            !Array.isArray(item)
          );
          
          if (allObjects) {
            // Array of objects - extract schema from first object
            schema.push({
              name: key,
              isArray: true,
              children: extractNestedSchema(firstItem),
            });
          } else {
            // Mixed array - treat as array of primitives/objects (no flattening)
            schema.push({ name: key, isArray: true });
          }
        } else {
          // Array of primitives
          schema.push({ name: key, isArray: true });
        }
      } else {
        // Empty array - can't determine type, treat as primitive array
        schema.push({ name: key, isArray: true });
      }
    } else if (typeof value === 'object') {
      // Nested object - recursively extract schema
      schema.push({
        name: key,
        isArray: false,
        children: extractNestedSchema(value),
      });
    } else {
      // Primitive field
      schema.push({ name: key, isArray: false });
    }
  }
  
  return schema;
}

/**
 * Encodes schema to nested format string
 */
export function encodeNestedSchema(schema: SchemaField[]): string {
  const parts: string[] = [];
  
  for (const field of schema) {
    let fieldStr = field.name;
    
    if (field.children && field.children.length > 0) {
      // Has children - encode them
      const nestedContent = encodeNestedSchema(field.children);
      
      if (field.isArray) {
        // Array of objects: name[children]
        fieldStr += '[' + nestedContent + ']';
      } else {
        // Nested object: name{children}
        fieldStr += '{' + nestedContent + '}';
      }
    } else if (field.isArray) {
      // Array of primitives: name[]
      fieldStr += '[]';
    }
    
    parts.push(fieldStr);
  }
  
  return parts.join(',');
}

/**
 * Parses nested schema from string
 */
export function parseNestedSchema(schemaStr: string): SchemaField[] {
  const schema: SchemaField[] = [];
  let i = 0;
  
  while (i < schemaStr.length) {
    // Skip commas
    if (schemaStr[i] === ',') {
      i++;
      continue;
    }
    
    // Parse field name
    let fieldName = '';
    while (i < schemaStr.length && 
           schemaStr[i] !== ',' && 
           schemaStr[i] !== '{' && 
           schemaStr[i] !== '}' &&
           schemaStr[i] !== '[') {
      fieldName += schemaStr[i];
      i++;
    }
    
    fieldName = fieldName.trim();
    if (!fieldName) {
      i++;
      continue;
    }
    
    let isArray = false;
    let children: SchemaField[] | undefined;
    
    // Check for [children] (array of objects) or [] (array of primitives) or {children} (nested object)
    if (i < schemaStr.length && schemaStr[i] === '[') {
      // Could be [] or [children]
      if (i + 1 < schemaStr.length && schemaStr[i + 1] === ']') {
        // Array of primitives: []
        isArray = true;
        i += 2; // Skip []
      } else {
        // Array of objects: [children]
        isArray = true;
        i++; // Skip [
        const nestedStr = extractNestedContent(schemaStr, i, '[', ']');
        children = parseNestedSchema(nestedStr);
        i += nestedStr.length + 1; // Skip content and ]
      }
    } else if (i < schemaStr.length && schemaStr[i] === '{') {
      // Nested object: {children}
      i++; // Skip {
      const nestedStr = extractNestedContent(schemaStr, i, '{', '}');
      children = parseNestedSchema(nestedStr);
      i += nestedStr.length + 1; // Skip content and }
    }
    
    schema.push({
      name: fieldName,
      isArray,
      children,
    });
  }
  
  return schema;
}

/**
 * Extracts nested content between braces or brackets, handling nested structures
 */
function extractNestedContent(str: string, start: number, openChar: string = '{', closeChar: string = '}'): string {
  let depth = 1;
  let i = start;
  let content = '';
  
  while (i < str.length && depth > 0) {
    if (str[i] === openChar) {
      depth++;
    } else if (str[i] === closeChar) {
      depth--;
      if (depth === 0) {
        break;
      }
    }
    if (depth > 0) {
      content += str[i];
    }
    i++;
  }
  
  return content;
}

/**
 * Flattens nested schema to flat field list with dot notation
 * Used for encoding/decoding data rows
 * For arrays of objects, includes children fields
 */
export function flattenSchema(schema: SchemaField[], prefix: string = ''): Array<{ name: string; isArray: boolean; arrayChildren?: SchemaField[] }> {
  const flat: Array<{ name: string; isArray: boolean; arrayChildren?: SchemaField[] }> = [];
  
  for (const field of schema) {
    const fullName = prefix ? `${prefix}.${field.name}` : field.name;
    
    if (field.children && field.children.length > 0) {
      if (field.isArray) {
        // Array of objects - keep children for encoding/decoding
        flat.push({ name: fullName, isArray: true, arrayChildren: field.children });
      } else {
        // Nested object - recursively flatten
        const nested = flattenSchema(field.children, fullName);
        flat.push(...nested);
      }
    } else {
      // Leaf field
      flat.push({ name: fullName, isArray: field.isArray });
    }
  }
  
  return flat;
}

