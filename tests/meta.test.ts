import { describe, it, expect } from 'vitest';
import { parseMetadata, encodeMetadata } from '../src/utils/meta';
import type { JPACKEDMetadata } from '../src/types';

describe('Metadata Utilities', () => {
  describe('parseMetadata', () => {
    it('should parse metadata with count only', () => {
      const result = parseMetadata('meta[20]');
      expect(result).toEqual({ count: 20 });
    });
    
    it('should parse metadata with count and page', () => {
      const result = parseMetadata('meta[20][1]');
      expect(result).toEqual({ count: 20, page: 1 });
    });
    
    it('should parse metadata with count, page, and pageCount', () => {
      const result = parseMetadata('meta[20][1][5]');
      expect(result).toEqual({ count: 20, page: 1, pageCount: 5 });
    });
    
    it('should parse metadata with all fields', () => {
      const result = parseMetadata('meta[20][1][5][200]');
      expect(result).toEqual({ count: 20, page: 1, pageCount: 5, total: 200 });
    });
    
    it('should throw error on invalid format', () => {
      expect(() => parseMetadata('invalid')).toThrow('Invalid metadata format');
      expect(() => parseMetadata('meta[]')).toThrow('Invalid metadata format');
      expect(() => parseMetadata('meta[abc]')).toThrow('Invalid metadata format');
    });
  });
  
  describe('encodeMetadata', () => {
    it('should encode metadata with count only', () => {
      const metadata: JPACKEDMetadata = { count: 20 };
      expect(encodeMetadata(metadata)).toBe('meta[20]');
    });
    
    it('should encode metadata with count and page', () => {
      const metadata: JPACKEDMetadata = { count: 20, page: 1 };
      expect(encodeMetadata(metadata)).toBe('meta[20][1]');
    });
    
    it('should encode metadata with count, page, and pageCount', () => {
      const metadata: JPACKEDMetadata = { count: 20, page: 1, pageCount: 5 };
      expect(encodeMetadata(metadata)).toBe('meta[20][1][5]');
    });
    
    it('should encode metadata with all fields', () => {
      const metadata: JPACKEDMetadata = {
        count: 20,
        page: 1,
        pageCount: 5,
        total: 200,
      };
      expect(encodeMetadata(metadata)).toBe('meta[20][1][5][200]');
    });
    
    it('should not include pageCount without page', () => {
      const metadata: JPACKEDMetadata = { count: 20, pageCount: 5 };
      expect(encodeMetadata(metadata)).toBe('meta[20]');
    });
    
    it('should not include total without pageCount', () => {
      const metadata: JPACKEDMetadata = { count: 20, total: 200 };
      expect(encodeMetadata(metadata)).toBe('meta[20]');
    });
  });
  
  describe('Round-trip metadata encoding', () => {
    it('should round-trip count only', () => {
      const original: JPACKMetadata = { count: 20 };
      const encoded = encodeMetadata(original);
      const parsed = parseMetadata(encoded);
      expect(parsed).toEqual(original);
    });
    
    it('should round-trip with all fields', () => {
      const original: JPACKMetadata = {
        count: 20,
        page: 1,
        pageCount: 5,
        total: 200,
      };
      const encoded = encodeMetadata(original);
      const parsed = parseMetadata(encoded);
      expect(parsed).toEqual(original);
    });
  });
});

