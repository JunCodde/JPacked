import { describe, it, expect } from 'vitest';
import { encodeArray, decodeArray } from '../src/utils/escape';
import { encode } from '../src/encoder';
import { decode } from '../src/decoder';

describe('Array Encoding/Decoding', () => {
  describe('encodeArray', () => {
    it('should encode simple array', () => {
      expect(encodeArray(['a', 'b', 'c'])).toBe('a|b|c');
    });
    
    it('should escape pipe characters', () => {
      expect(encodeArray(['a|b', 'c'])).toBe('a\\|b|c');
    });
    
    it('should escape backslashes', () => {
      expect(encodeArray(['a\\b', 'c'])).toBe('a\\\\b|c');
    });
    
    it('should escape both pipe and backslash', () => {
      expect(encodeArray(['a|b', 'c\\d'])).toBe('a\\|b|c\\\\d');
    });
    
    it('should handle empty array', () => {
      expect(encodeArray([])).toBe('');
    });
    
    it('should handle empty strings', () => {
      expect(encodeArray(['', 'b', ''])).toBe('|b|');
    });
  });
  
  describe('decodeArray', () => {
    it('should decode simple array', () => {
      expect(decodeArray('a|b|c')).toEqual(['a', 'b', 'c']);
    });
    
    it('should decode escaped pipe', () => {
      expect(decodeArray('a\\|b|c')).toEqual(['a|b', 'c']);
    });
    
    it('should decode escaped backslash', () => {
      expect(decodeArray('a\\\\b|c')).toEqual(['a\\b', 'c']);
    });
    
    it('should decode both escapes', () => {
      expect(decodeArray('a\\|b|c\\\\d')).toEqual(['a|b', 'c\\d']);
    });
    
    it('should handle empty string', () => {
      expect(decodeArray('')).toEqual([]);
    });
    
    it('should handle empty fields', () => {
      expect(decodeArray('|b|')).toEqual(['', 'b', '']);
    });
  });
  
  describe('Round-trip encoding', () => {
    it('should round-trip simple arrays', () => {
      const original = ['tag1', 'tag2', 'tag3'];
      const encoded = encodeArray(original);
      const decoded = decodeArray(encoded);
      expect(decoded).toEqual(original);
    });
    
    it('should round-trip arrays with pipes', () => {
      const original = ['a|b', 'c|d'];
      const encoded = encodeArray(original);
      const decoded = decodeArray(encoded);
      expect(decoded).toEqual(original);
    });
    
    it('should round-trip arrays with backslashes', () => {
      const original = ['a\\b', 'c\\d'];
      const encoded = encodeArray(original);
      const decoded = decodeArray(encoded);
      expect(decoded).toEqual(original);
    });
    
    it('should round-trip complex arrays', () => {
      const original = ['a|b', 'c\\d', 'e|f\\g'];
      const encoded = encodeArray(original);
      const decoded = decodeArray(encoded);
      expect(decoded).toEqual(original);
    });
  });
  
  describe('Full JPACKED encoding with arrays', () => {
    it('should encode and decode data with arrays', () => {
      const data = [
        { id: 1, tags: ['tag1', 'tag2'], name: 'Test' },
        { id: 2, tags: ['tag3|special', 'tag4\\back'], name: 'Complex' },
      ];
      
      const encoded = encode(data, { count: 2 });
      const decoded = decode(encoded);
      
      expect(decoded.data[0].tags).toEqual(['tag1', 'tag2']);
      expect(decoded.data[1].tags).toEqual(['tag3|special', 'tag4\\back']);
    });
  });
});

