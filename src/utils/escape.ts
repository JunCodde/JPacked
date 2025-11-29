/**
 * Escape utilities for JPACKED array encoding
 * 
 * Rules:
 * - | → \| (delimiter escape)
 * - \ → \\ (backslash escape)
 */

/**
 * Encodes an array of strings into JPACKED array format
 * @param arr Array of strings to encode
 * @returns Encoded string with | delimiter
 */
export function encodeArray(arr: string[]): string {
  if (arr.length === 0) return '';
  
  // Optimized: single replace with function
  return arr
    .map((item) => {
      if (item.includes('\\') || item.includes('|')) {
        // Only escape if needed
        return item.replace(/[\\|]/g, (m) => m === '\\' ? '\\\\' : '\\|');
      }
      return item;
    })
    .join('|');
}

/**
 * Decodes a JPACKED array string into an array of strings
 * @param str Encoded array string
 * @returns Array of decoded strings
 */
export function decodeArray(str: string): string[] {
  if (!str) return [];
  
  const result: string[] = [];
  let current = '';
  let i = 0;
  
  while (i < str.length) {
    const char = str[i];
    
    if (char === '\\') {
      // Check next character
      if (i + 1 < str.length) {
        const next = str[i + 1];
        if (next === '|') {
          current += '|';
          i += 2;
        } else if (next === '\\') {
          current += '\\';
          i += 2;
        } else {
          // Invalid escape, treat as literal backslash
          current += '\\';
          i += 1;
        }
      } else {
        current += '\\';
        i += 1;
      }
    } else if (char === '|') {
      // Delimiter found
      result.push(current);
      current = '';
      i += 1;
    } else {
      current += char;
      i += 1;
    }
  }
  
  // Push remaining content
  if (current !== '' || result.length > 0) {
    result.push(current);
  }
  
  return result;
}

