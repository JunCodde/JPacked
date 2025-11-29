/**
 * CSV parsing utilities for JPACKED
 * 
 * Rules:
 * - Commas separate columns
 * - Values containing comma, newline, or quotes are enclosed in "..."
 * - Internal quotes are doubled: " → ""
 */

/**
 * Encodes a value for CSV output
 * @param value Value to encode
 * @returns CSV-encoded string
 */
export function encodeCSVValue(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // Check if we need to quote the value
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    // Escape internal quotes by doubling them
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return str;
}

/**
 * Parses a CSV line into an array of values
 * @param line CSV line to parse
 * @returns Array of parsed values
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let i = 0;
  let inQuotes = false;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes) {
        // Check if it's a doubled quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i += 1;
        }
      } else {
        // Start of quoted field
        inQuotes = true;
        i += 1;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
      i += 1;
    } else {
      current += char;
      i += 1;
    }
  }
  
  // Push last field
  result.push(current);
  
  return result;
}

/**
 * Encodes an array of values into a CSV line
 * @param values Array of values to encode
 * @returns CSV-encoded line
 */
export function encodeCSVLine(values: string[]): string {
  if (values.length === 0) return '';
  
  // Optimized: pre-allocate array and join once
  const encoded: string[] = new Array(values.length);
  for (let i = 0; i < values.length; i++) {
    encoded[i] = encodeCSVValue(values[i]);
  }
  return encoded.join(',');
}

