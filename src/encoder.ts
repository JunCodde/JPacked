import type { JPACKEDMetadata, SchemaField } from './types';
import { encodeMetadata } from './utils/meta';
import { encodeCSVLine } from './utils/csv';
import { encodeArray } from './utils/escape';

/**
 * Extracts schema from data objects
 */
function extractSchema(data: Record<string, any>[]): SchemaField[] {
  if (data.length === 0) {
    return [];
  }
  
  const schema: SchemaField[] = [];
  const firstRow = data[0];
  
  for (const key in firstRow) {
    const value = firstRow[key];
    const isArray = Array.isArray(value);
    schema.push({ name: key, isArray });
  }
  
  return schema;
}

/**
 * Encodes schema into JPACKED schema line
 */
function encodeSchema(schema: SchemaField[]): string {
  const fields = schema.map((field) => {
    return field.isArray ? `${field.name}[]` : field.name;
  });
  return `schema{${fields.join(',')}}`;
}

/**
 * Encodes a data row into CSV format
 */
function encodeRow(row: Record<string, any>, schema: SchemaField[]): string {
  const values = schema.map((field) => {
    const value = row[field.name];
    
    if (value === null || value === undefined) {
      return '';
    }
    
    if (field.isArray) {
      if (Array.isArray(value)) {
        // Convert array items to strings and encode
        const stringArray = value.map((item) => String(item));
        return encodeArray(stringArray);
      } else {
        return '';
      }
    } else {
      return String(value);
    }
  });
  
  return encodeCSVLine(values);
}

/**
 * Encodes data into JPACKED format
 * @param data Array of objects to encode
 * @param metadata Metadata information
 * @returns JPACKED-encoded string
 */
export function encode(data: Record<string, any>[], metadata: JPACKEDMetadata): string {
  const lines: string[] = [];
  
  // Header
  lines.push('JPACKED/1.1');
  
  // Metadata
  lines.push(encodeMetadata(metadata));
  
  // Schema
  const schema = extractSchema(data);
  lines.push(encodeSchema(schema));
  
  // Data section
  lines.push('data');
  
  // Data rows
  for (const row of data) {
    lines.push(encodeRow(row, schema));
  }
  
  return lines.join('\n');
}

