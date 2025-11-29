import type { JPACKEDMetadata, SchemaField, DecodeResult } from './types';
import { parseMetadata } from './utils/meta';
import { parseCSVLine } from './utils/csv';
import { decodeArray } from './utils/escape';

/**
 * Parses schema line into SchemaField array
 */
function parseSchema(line: string): SchemaField[] {
  const match = line.match(/^schema\{([^}]*)\}$/);
  
  if (!match) {
    throw new Error(`Invalid schema format: ${line}`);
  }
  
  const fieldsStr = match[1];
  if (!fieldsStr || fieldsStr.trim() === '') {
    return [];
  }
  
  const fieldNames = fieldsStr.split(',');
  const schema: SchemaField[] = [];
  
  for (const fieldName of fieldNames) {
    const trimmed = fieldName.trim();
    if (trimmed) {
      const isArray = trimmed.endsWith('[]');
      const name = isArray ? trimmed.slice(0, -2) : trimmed;
      schema.push({ name, isArray });
    }
  }
  
  return schema;
}

/**
 * Decodes a CSV row into an object based on schema
 */
function decodeRow(
  csvLine: string,
  schema: SchemaField[]
): Record<string, any> {
  const values = parseCSVLine(csvLine);
  const obj: Record<string, any> = {};
  
  for (let i = 0; i < schema.length; i++) {
    const field = schema[i];
    const value = values[i] || '';
    
    if (field.isArray) {
      if (value) {
        const decoded = decodeArray(value);
        // Try to convert to numbers if possible
        obj[field.name] = decoded.map((item) => {
          const num = Number(item);
          return isNaN(num) ? item : num;
        });
      } else {
        obj[field.name] = [];
      }
    } else {
      // Try to convert to number or boolean
      if (value === '') {
        obj[field.name] = null;
      } else if (value === 'true') {
        obj[field.name] = true;
      } else if (value === 'false') {
        obj[field.name] = false;
      } else {
        const num = Number(value);
        obj[field.name] = isNaN(num) ? value : num;
      }
    }
  }
  
  return obj;
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
  
  // Find data section
  if (lines[3] !== 'data') {
    throw new Error(`Expected "data" marker, got "${lines[3]}"`);
  }
  
  // Parse data rows
  const data: T[] = [];
  for (let i = 4; i < lines.length; i++) {
    const row = decodeRow(lines[i], schema);
    data.push(row as T);
  }
  
  return {
    data,
    metadata,
    schema,
  };
}

