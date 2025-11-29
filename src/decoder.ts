import type { JPACKEDMetadata, SchemaField, DecodeResult } from './types';
import { parseMetadata } from './utils/meta';
import { parseCSVLine } from './utils/csv';
import { decodeArray } from './utils/escape';
import { decodeObject, decodeArrayWithObjects } from './utils/object';
import { unflattenObject } from './utils/flatten';
import { parseNestedSchema, flattenSchema } from './utils/schema';

/**
 * Parses schema line into nested SchemaField array
 */
function parseSchema(line: string): SchemaField[] {
  const match = line.match(/^schema\{(.*)\}$/);
  
  if (!match) {
    throw new Error(`Invalid schema format: ${line}`);
  }
  
  const fieldsStr = match[1];
  if (!fieldsStr || fieldsStr.trim() === '') {
    return [];
  }
  
  return parseNestedSchema(fieldsStr);
}

/**
 * Decodes a CSV row into an object based on schema
 */
function decodeRow(
  csvLine: string,
  flatSchema: Array<{ name: string; isArray: boolean; arrayChildren?: SchemaField[] }>
): Record<string, any> {
  const values = parseCSVLine(csvLine);
  const flat: Record<string, any> = {};
  
  for (let i = 0; i < flatSchema.length; i++) {
    const field = flatSchema[i];
    const value = values[i] || '';
    
    if (field.isArray) {
      if (value) {
        if (field.arrayChildren && field.arrayChildren.length > 0) {
          // Check if this is a mixed array (contains objects in {format})
          // If the value contains {, it's likely a mixed array
          const hasObjectFormat = value.includes('{');
          
          if (hasObjectFormat) {
            // Mixed array - decode using object format
            const decoded = decodeArrayWithObjects(value);
            flat[field.name] = decoded;
          } else {
            // Array of objects only - decode from CSV format
            // Value is CSV (may be quoted), contains objects separated by |
            const flatChildren = flattenSchema(field.arrayChildren);
            const decodedArray: any[] = [];
            
            // Split by | to get each object (as CSV string)
            const objectStrings = decodeArray(value);
            
            for (const objectStr of objectStrings) {
              // Parse each object as CSV
              const objectValues = parseCSVLine(objectStr);
              const flatObject: Record<string, any> = {};
              
              for (let k = 0; k < flatChildren.length && k < objectValues.length; k++) {
                const childField = flatChildren[k];
                const childValue = objectValues[k] || '';
                
                // Parse value
                let parsedValue: any = childValue;
                if (childValue === '') {
                  parsedValue = null;
                } else if (childField.isArray) {
                  // Array field - decode it
                  if (childField.arrayChildren && childField.arrayChildren.length > 0) {
                    // Array of objects - recursive decode from CSV
                    const nestedFlatChildren = flattenSchema(childField.arrayChildren);
                    const nestedDecoded: any[] = [];
                    
                    const nestedObjectStrings = decodeArray(childValue);
                    for (const nestedObjectStr of nestedObjectStrings) {
                      const nestedObjectValues = parseCSVLine(nestedObjectStr);
                      const nestedFlatObject: Record<string, any> = {};
                      
                      for (let m = 0; m < nestedFlatChildren.length && m < nestedObjectValues.length; m++) {
                        const nestedChildField = nestedFlatChildren[m];
                        const nestedChildValue = nestedObjectValues[m] || '';
                        let nestedParsedValue: any = nestedChildValue;
                        if (nestedChildValue === '') {
                          nestedParsedValue = null;
                        } else {
                          const num = Number(nestedChildValue);
                          if (!isNaN(num) && nestedChildValue.trim() !== '') {
                            nestedParsedValue = num;
                          } else if (nestedChildValue === 'true') {
                            nestedParsedValue = true;
                          } else if (nestedChildValue === 'false') {
                            nestedParsedValue = false;
                          }
                        }
                        nestedFlatObject[nestedChildField.name] = nestedParsedValue;
                      }
                      nestedDecoded.push(unflattenObject(nestedFlatObject));
                    }
                    parsedValue = nestedDecoded;
                  } else {
                    // Array of primitives
                    parsedValue = decodeArrayWithObjects(childValue);
                  }
                } else {
                  const num = Number(childValue);
                  if (!isNaN(num) && childValue.trim() !== '') {
                    parsedValue = num;
                  } else if (childValue === 'true') {
                    parsedValue = true;
                  } else if (childValue === 'false') {
                    parsedValue = false;
                  }
                }
                
                flatObject[childField.name] = parsedValue;
              }
              
              // Unflatten to restore nested structure
              const unflattened = unflattenObject(flatObject);
              decodedArray.push(unflattened);
            }
            
            flat[field.name] = decodedArray;
          }
        } else {
          // Array of primitives or mixed - decode normally
          const decoded = decodeArrayWithObjects(value);
          flat[field.name] = decoded;
        }
      } else {
        flat[field.name] = [];
      }
    } else {
      // Try to convert to number or boolean
      if (value === '') {
        flat[field.name] = null;
      } else if (value === 'true') {
        flat[field.name] = true;
      } else if (value === 'false') {
        flat[field.name] = false;
      } else {
        // Try to convert to number
        const num = Number(value);
        flat[field.name] = isNaN(num) ? value : num;
      }
    }
  }
  
  // Unflatten to restore nested structure
  return unflattenObject(flat);
}

/**
 * Decodes JPACKED format into data objects
 * @param jpackedString JPACKED-encoded string
 * @returns Decoded result with data, metadata, and schema
 * @throws Error if format is invalid
 */
export function decode<T = Record<string, any>>(jpackedString: string): DecodeResult<T> {
  const lines = jpackedString.split(/\r?\n/).filter((line) => line.trim() !== '');
  
  if (lines.length === 0) {
    throw new Error('Empty JPACKED string');
  }
  
  // Validate header
  if (lines[0] !== 'JPACKED/1.1') {
    throw new Error(`Invalid JPACKED header. Expected "JPACKED/1.1", got "${lines[0]}"`);
  }
  
  if (lines.length < 4) {
    throw new Error('JPACKED string too short. Expected at least header, metadata, schema, and data marker');
  }
  
  // Parse metadata
  const metadata = parseMetadata(lines[1]);
  
  // Parse schema
  const schema = parseSchema(lines[2]);
  
  // Pre-compute flattened schema (only once)
  const flatSchema = flattenSchema(schema);
  
  // Find data section
  if (lines[3] !== 'data') {
    throw new Error(`Expected "data" marker, got "${lines[3]}"`);
  }
  
  // Parse data rows
  const data: T[] = [];
  for (let i = 4; i < lines.length; i++) {
    const row = decodeRow(lines[i], flatSchema);
    data.push(row as T);
  }
  
  return {
    data,
    metadata,
    schema,
  };
}

