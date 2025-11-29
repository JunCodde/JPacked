/**
 * Flattening utilities for nested objects
 * Converts nested objects to flat structure with dot notation
 */

/**
 * Flattens an object using dot notation
 * @param obj Object to flatten
 * @param prefix Prefix for nested keys (for recursion)
 * @returns Flattened object with dot notation keys
 */
export function flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, any> {
  const flattened: Record<string, any> = {};
  
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value === null || value === undefined) {
      flattened[newKey] = null;
    } else if (Array.isArray(value)) {
      // Arrays are kept as-is (they will be handled separately)
      flattened[newKey] = value;
    } else if (typeof value === 'object') {
      // Recursively flatten nested objects
      const nested = flattenObject(value, newKey);
      Object.assign(flattened, nested);
    } else {
      // Primitive value
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

/**
 * Unflattens an object from dot notation back to nested structure
 * @param flat Flattened object with dot notation keys
 * @returns Nested object structure
 */
export function unflattenObject(flat: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const key in flat) {
    const value = flat[key];
    const keys = key.split('.');
    
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object' || Array.isArray(current[k])) {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
  }
  
  return result;
}

