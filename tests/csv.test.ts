import { describe, it, expect } from 'vitest';
import { encodeCSVValue, parseCSVLine, encodeCSVLine } from '../src/utils/csv';

describe('CSV Utilities', () => {
  describe('encodeCSVValue', () => {
    it('should encode simple value', () => {
      expect(encodeCSVValue('hello')).toBe('hello');
    });
    
    it('should quote value with comma', () => {
      expect(encodeCSVValue('hello, world')).toBe('"hello, world"');
    });
    
    it('should quote value with newline', () => {
      expect(encodeCSVValue('hello\nworld')).toBe('"hello\nworld"');
    });
    
    it('should escape quotes in quoted value', () => {
      expect(encodeCSVValue('He said "Hello"')).toBe('"He said ""Hello"""');
    });
    
    it('should handle null/undefined', () => {
      expect(encodeCSVValue(null as any)).toBe('');
      expect(encodeCSVValue(undefined as any)).toBe('');
    });
  });
  
  describe('parseCSVLine', () => {
    it('should parse simple CSV line', () => {
      expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
    });
    
    it('should parse quoted values', () => {
      expect(parseCSVLine('"a,b",c')).toEqual(['a,b', 'c']);
    });
    
    it('should parse doubled quotes', () => {
      expect(parseCSVLine('"He said ""Hello""",world')).toEqual(['He said "Hello"', 'world']);
    });
    
    it('should handle empty fields', () => {
      expect(parseCSVLine('a,,c')).toEqual(['a', '', 'c']);
    });
    
    it('should handle trailing comma', () => {
      expect(parseCSVLine('a,b,')).toEqual(['a', 'b', '']);
    });
  });
  
  describe('encodeCSVLine', () => {
    it('should encode simple line', () => {
      expect(encodeCSVLine(['a', 'b', 'c'])).toBe('a,b,c');
    });
    
    it('should encode line with special characters', () => {
      expect(encodeCSVLine(['a,b', 'c'])).toBe('"a,b",c');
    });
    
    it('should encode line with quotes', () => {
      expect(encodeCSVLine(['He said "Hello"', 'world'])).toBe('"He said ""Hello""",world');
    });
  });
  
  describe('Round-trip CSV encoding', () => {
    it('should round-trip simple values', () => {
      const original = ['a', 'b', 'c'];
      const encoded = encodeCSVLine(original);
      const parsed = parseCSVLine(encoded);
      expect(parsed).toEqual(original);
    });
    
    it('should round-trip values with commas', () => {
      const original = ['a,b', 'c,d'];
      const encoded = encodeCSVLine(original);
      const parsed = parseCSVLine(encoded);
      expect(parsed).toEqual(original);
    });
    
    it('should round-trip values with quotes', () => {
      const original = ['He said "Hello"', 'She said "Hi"'];
      const encoded = encodeCSVLine(original);
      const parsed = parseCSVLine(encoded);
      expect(parsed).toEqual(original);
    });
  });
});

