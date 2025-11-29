import type { JPACKEDMetadata, SchemaField, EncodeMetadata } from './types';
import { encodeMetadata } from './utils/meta';
import { encodeCSVLine } from './utils/csv';
import { encodeArray } from './utils/escape';
import { flattenObject } from './utils/flatten';
import { encodeObject } from './utils/object';
import { extractNestedSchema, encodeNestedSchema, flattenSchema } from './utils/schema';

/**
 * Extracts schema from data objects with nested structure
 */
function extractSchema(data: Record<string, any>[]): SchemaField[] {
  if (data.length === 0) {
    return [];
  }
  
  // Extract nested schema from first row
  return extractNestedSchema(data[0]);
}

/**
 * Encodes schema into JPACKED schema line with nested format
 */
function encodeSchema(schema: SchemaField[]): string {
  const encoded = encodeNestedSchema(schema);
  return `schema{${encoded}}`;
}

/**
 * Encodes a data row into CSV format
 */
function encodeRow(row: Record<string, any>, flatSchema: Array<{ name: string; isArray: boolean; arrayChildren?: SchemaField[] }>, flattened: Record<string, any>): string {
  const values = flatSchema.map((field) => {
    const value = flattened[field.name];
    
    if (value === null || value === undefined) {
      return '';
    }
    
    if (field.isArray) {
      if (Array.isArray(value)) {
        if (field.arrayChildren && field.arrayChildren.length > 0) {
          // Check if all items are objects (for flattening)
          const allObjects = value.every(item => 
            item === null || 
            item === undefined || 
            (typeof item === 'object' && !Array.isArray(item))
          );
          
          if (allObjects) {
            // Array of objects - encode each object as CSV, separate objects with |
            const flatChildren = flattenSchema(field.arrayChildren);
            const objectStrings: string[] = [];
            
            for (const item of value) {
              if (item === null || item === undefined) {
                // Empty object - encode as empty CSV values
                const emptyValues = flatChildren.map(() => '');
                objectStrings.push(emptyValues.join(','));
              } else if (typeof item === 'object' && !Array.isArray(item)) {
                // Flatten the object
                const flatItem = flattenObject(item);
                // Get values in schema order
                const objectValues: string[] = [];
                for (const childField of flatChildren) {
                  const childValue = flatItem[childField.name];
                  
                  if (childValue === null || childValue === undefined) {
                    objectValues.push('');
                  } else if (childField.isArray) {
                    // Array within object - encode it
                    if (Array.isArray(childValue)) {
                      if (childField.arrayChildren && childField.arrayChildren.length > 0) {
                        // Array of objects - recursive encoding as CSV
                        const nestedFlatChildren = flattenSchema(childField.arrayChildren);
                        const nestedObjectStrings: string[] = [];
                        for (const nestedItem of childValue) {
                          if (nestedItem === null || nestedItem === undefined) {
                            const emptyNestedValues = nestedFlatChildren.map(() => '');
                            nestedObjectStrings.push(emptyNestedValues.join(','));
                          } else if (typeof nestedItem === 'object' && !Array.isArray(nestedItem)) {
                            const nestedFlatItem = flattenObject(nestedItem);
                            const nestedValues = nestedFlatChildren.map(f => {
                              const v = nestedFlatItem[f.name];
                              return v === null || v === undefined ? '' : String(v);
                            });
                            nestedObjectStrings.push(nestedValues.join(','));
                          } else {
                            nestedObjectStrings.push(String(nestedItem));
                          }
                        }
                        // Join nested objects with | and escape (optimized)
                        const nestedStr = nestedObjectStrings
                          .map((v) => {
                            if (v.includes('\\') || v.includes('|')) {
                              return v.replace(/[\\|]/g, (m) => m === '\\' ? '\\\\' : '\\|');
                            }
                            return v;
                          })
                          .join('|');
                        objectValues.push(nestedStr);
                      } else {
                        // Array of primitives (optimized)
                        const arrayStr = childValue
                          .map((v) => {
                            const s = String(v);
                            if (s.includes('\\') || s.includes('|')) {
                              return s.replace(/[\\|]/g, (m) => m === '\\' ? '\\\\' : '\\|');
                            }
                            return s;
                          })
                          .join('|');
                        objectValues.push(arrayStr);
                      }
                    } else {
                      objectValues.push('');
                    }
                  } else {
                    // Primitive value
                    objectValues.push(String(childValue));
                  }
                }
                // Join object values with comma (CSV format)
                objectStrings.push(objectValues.join(','));
              }
            }
            
            // Join all objects with | and escape (optimized)
            const result = objectStrings
              .map((item) => {
                if (item.includes('\\') || item.includes('|')) {
                  return item.replace(/[\\|]/g, (m) => m === '\\' ? '\\\\' : '\\|');
                }
                return item;
              })
              .join('|');
            
            // Return as CSV value (will be quoted if contains comma or |)
            return result;
          } else {
            // Mixed array - use object format for objects, primitives as-is
            const encodedArray = value.map((item) => {
              if (item === null || item === undefined) {
                return '';
              } else if (typeof item === 'object' && !Array.isArray(item)) {
                // Object in mixed array - use object format (keys will be repeated, but it's a mixed array)
                return encodeObject(item);
              } else {
                return String(item);
              }
            });
            // Use pipe delimiter for arrays (optimized)
            return encodedArray
              .map((item) => {
                if (item.includes('\\') || item.includes('|')) {
                  return item.replace(/[\\|]/g, (m) => m === '\\' ? '\\\\' : '\\|');
                }
                return item;
              })
              .join('|');
          }
        } else {
          // Array of primitives or mixed - check if there are objects
          const hasObjects = value.some(item => 
            item !== null && 
            item !== undefined && 
            typeof item === 'object' && 
            !Array.isArray(item)
          );
          
          if (hasObjects) {
            // Mixed array - use object format for objects, primitives as-is
            const encodedArray = value.map((item) => {
              if (item === null || item === undefined) {
                return '';
              } else if (typeof item === 'object' && !Array.isArray(item)) {
                // Object in mixed array - use object format (keys will be repeated, but it's a mixed array)
                return encodeObject(item);
              } else {
                return String(item);
              }
            });
            // Use pipe delimiter for arrays (optimized)
            return encodedArray
              .map((item) => {
                if (item.includes('\\') || item.includes('|')) {
                  return item.replace(/[\\|]/g, (m) => m === '\\' ? '\\\\' : '\\|');
                }
                return item;
              })
              .join('|');
          } else {
            // Array of primitives only (optimized)
            const encodedArray: string[] = [];
            for (const item of value) {
              if (item === null || item === undefined) {
                encodedArray.push('');
              } else {
                encodedArray.push(String(item));
              }
            }
            // Use pipe delimiter for arrays (optimized)
            return encodedArray
              .map((item) => {
                if (item.includes('\\') || item.includes('|')) {
                  return item.replace(/[\\|]/g, (m) => m === '\\' ? '\\\\' : '\\|');
                }
                return item;
              })
              .join('|');
          }
        }
      } else {
        return '';
      }
    } else {
      // Primitive value - already flattened
      return String(value);
    }
  });
  
  return encodeCSVLine(values);
}

/**
 * Encodes data into JPACKED format
 * @param data Array of objects or a single object to encode
 * @param metadata Optional metadata (count is auto-calculated from data.length if not provided)
 * @returns JPACKED-encoded string
 */
export function encode(
  data: Record<string, any>[] | Record<string, any>,
  metadata?: EncodeMetadata
): string {
  // Normalize: convert single object to array
  const dataArray = Array.isArray(data) ? data : [data];
  
  const lines: string[] = [];
  
  // Header
  lines.push('JPACKED/1.1');
  
  // Metadata - auto-calculate count from data.length if not provided
  const fullMetadata: JPACKEDMetadata = {
    count: metadata?.count ?? dataArray.length,
    page: metadata?.page,
    pageCount: metadata?.pageCount,
    total: metadata?.total,
  };
  lines.push(encodeMetadata(fullMetadata));
  
  // Schema
  const schema = extractSchema(dataArray);
  lines.push(encodeSchema(schema));
  
  // Data section
  lines.push('data');
  
  // Pre-compute flattened schema (only once)
  const flatSchema = flattenSchema(schema);
  
  // Data rows
  for (const row of dataArray) {
    // Flatten row once per row
    const flattened = flattenObject(row);
    lines.push(encodeRow(row, flatSchema, flattened));
  }
  
  return lines.join('\n');
}

