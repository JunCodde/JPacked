/**
 * Object encoding utilities for JPACKED nested objects
 * 
 * Format: {field1:value1,field2:value2}
 * - Fields separated by commas
 * - Values can be primitives or nested objects
 * - Escape { as \{ and } as \}
 * - Escape \ as \\
 */

/**
 * Encodes a nested object into JPACKED object format
 * @param obj Object to encode
 * @returns Encoded string in format {field:value,field:value}
 */
export function encodeObject(obj: Record<string, any>): string {
  const parts: string[] = [];
  
  for (const key in obj) {
    const value = obj[key];
    let encodedValue: string;
    
    if (value === null || value === undefined) {
      encodedValue = '';
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Nested object - recursive encoding
      encodedValue = encodeObject(value);
    } else if (Array.isArray(value)) {
      // Arrays are encoded with | delimiter and wrapped in []
      const arrayStr = encodeArrayValue(value);
      encodedValue = `[${arrayStr}]`;
    } else {
      // Primitive value - convert to string and escape if needed
      encodedValue = String(value);
    }
    
    // Escape special characters in key
    const escapedKey = escapeObjectString(key);
    // Escape special characters in value
    const escapedValue = escapeObjectString(encodedValue);
    
    parts.push(`${escapedKey}:${escapedValue}`);
  }
  
  return `{${parts.join(',')}}`;
}

/**
 * Encodes an array value (can contain primitives or objects)
 */
function encodeArrayValue(arr: any[]): string {
  return arr
    .map((item) => {
      if (item === null || item === undefined) {
        return '';
      } else if (typeof item === 'object' && !Array.isArray(item)) {
        // Object in array
        return encodeObject(item);
      } else {
        return String(item);
      }
    })
    .map((item) => escapeObjectString(item))
    .join('|');
}

/**
 * Escapes special characters in object strings
 */
function escapeObjectString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/,/g, '\\,')
    .replace(/:/g, '\\:')
    .replace(/\|/g, '\\|');
}

/**
 * Decodes a JPACKED object string into an object
 * @param str Encoded object string
 * @returns Decoded object
 */
export function decodeObject(str: string): Record<string, any> {
  if (!str || !str.startsWith('{') || !str.endsWith('}')) {
    throw new Error(`Invalid object format: ${str}`);
  }
  
  // Remove outer braces
  const content = str.slice(1, -1);
  if (!content) {
    return {};
  }
  
  const obj: Record<string, any> = {};
  let i = 0;
  let currentKey = '';
  let currentValue = '';
  let inKey = true;
  let depth = 0;
  
  while (i < content.length) {
    const char = content[i];
    
    if (char === '\\') {
      // Escape sequence
      if (i + 1 < content.length) {
        const next = content[i + 1];
        if (next === '{' || next === '}' || next === ',' || next === ':' || next === '|' || next === '\\') {
          if (inKey) {
            currentKey += next;
          } else {
            currentValue += next;
          }
          i += 2;
          continue;
        }
      }
      // Invalid escape, treat as literal
      if (inKey) {
        currentKey += '\\';
      } else {
        currentValue += '\\';
      }
      i += 1;
    } else if (char === ':' && depth === 0 && inKey) {
      // Key-value separator
      inKey = false;
      i += 1;
    } else if (char === ',' && depth === 0 && !inKey) {
      // Field separator - save current field
      obj[unescapeObjectString(currentKey)] = parseObjectValue(unescapeObjectString(currentValue), true);
      currentKey = '';
      currentValue = '';
      inKey = true;
      i += 1;
    } else {
      // Regular character
      if (char === '{') depth++;
      if (char === '}') depth--;
      
      if (inKey) {
        currentKey += char;
      } else {
        currentValue += char;
      }
      i += 1;
    }
  }
  
  // Save last field
  if (currentKey || currentValue) {
    obj[unescapeObjectString(currentKey)] = parseObjectValue(unescapeObjectString(currentValue), true);
  }
  
  return obj;
}

/**
 * Unescapes object string
 */
function unescapeObjectString(str: string): string {
  return str
    .replace(/\\\|/g, '|')
    .replace(/\\:/g, ':')
    .replace(/\\,/g, ',')
    .replace(/\\}/g, '}')
    .replace(/\\{/g, '{')
    .replace(/\\\\/g, '\\');
}

/**
 * Parses an object value (can be primitive, object, or array)
 * @param value The value string to parse
 * @param isInsideObject Whether this value is inside an object (affects array detection)
 */
function parseObjectValue(value: string, isInsideObject: boolean = false): any {
  if (value === '') {
    return null;
  }
  
  // Check if it's a nested object
  if (value.trim().startsWith('{') && value.trim().endsWith('}')) {
    try {
      return decodeObject(value);
    } catch {
      // If parsing fails, treat as string
    }
  }
  
  // Check if it's an array (wrapped in [])
  const trimmed = value.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    // Array inside object - remove brackets and decode
    const arrayContent = trimmed.slice(1, -1);
    const parts = decodeArrayValue(arrayContent);
    return parts.map((part) => {
      // Try to parse each part
      if (part.trim().startsWith('{') && part.trim().endsWith('}')) {
        try {
          return decodeObject(part);
        } catch {
          return parsePrimitive(part);
        }
      }
      return parsePrimitive(part);
    });
  }
  
  // Don't parse as array - arrays are already split by decodeArrayWithObjects
  // This function is only called for individual array items or object values
  // Try as primitive
  return parsePrimitive(value);
}

/**
 * Parses a primitive value (number, boolean, or string)
 */
function parsePrimitive(value: string): any {
  // Try number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return num;
  }
  
  // Try boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  return value;
}

/**
 * Decodes an array value string
 */
function decodeArrayValue(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let i = 0;
  let depth = 0;
  
  while (i < str.length) {
    const char = str[i];
    
    if (char === '\\') {
      if (i + 1 < str.length) {
        const next = str[i + 1];
        if (next === '|' || next === '{' || next === '}' || next === '\\') {
          current += next;
          i += 2;
          continue;
        }
      }
      current += '\\';
      i += 1;
    } else if (char === '|' && depth === 0) {
      result.push(current);
      current = '';
      i += 1;
    } else {
      if (char === '{') depth++;
      if (char === '}') depth--;
      current += char;
      i += 1;
    }
  }
  
  if (current !== '' || result.length > 0) {
    result.push(current);
  }
  
  return result;
}

/**
 * Decodes an array string that may contain objects
 * Respects object boundaries when splitting by |
 */
export function decodeArrayWithObjects(str: string): any[] {
  if (!str) return [];
  
  const result: any[] = [];
  let current = '';
  let i = 0;
  let depth = 0;
  let escaped = false;
  
  while (i < str.length) {
    const char = str[i];
    
    if (escaped) {
      // Previous character was escape, add this character literally
      current += char;
      escaped = false;
      i += 1;
      continue;
    }
    
    if (char === '\\') {
      // Check if next character is a special character
      if (i + 1 < str.length) {
        const next = str[i + 1];
        if (next === '|' || next === '{' || next === '}' || next === '\\') {
          // Valid escape - add the escaped character
          current += next;
          i += 2;
          continue;
        }
      }
      // Invalid escape or end of string - treat as literal backslash
      current += '\\';
      i += 1;
    } else if (char === '|' && depth === 0) {
      // Array delimiter - only when not inside an object and not escaped
      result.push(parseObjectValue(current, false));
      current = '';
      i += 1;
    } else {
      // Track depth for nested objects
      if (char === '{') depth++;
      if (char === '}') depth--;
      current += char;
      i += 1;
    }
  }
  
  // Push last item
  if (current !== '' || result.length > 0) {
    result.push(parseObjectValue(current, false));
  }
  
  return result;
}

