import { describe, it, expect } from 'vitest';
import { encode } from '../src/encoder';
import type { JPACKEDMetadata } from '../src/types';

describe('Encoder', () => {
  it('should encode simple data', () => {
    const data = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ];
    
    // count is auto-calculated from data.length
    const result = encode(data);
    
    expect(result).toContain('JPACKED/1.1');
    expect(result).toContain('meta[2]');
    expect(result).toContain('schema{id,name,age}');
    expect(result).toContain('data');
    expect(result).toContain('1,Alice,30');
    expect(result).toContain('2,Bob,25');
  });
  
  it('should encode data with arrays', () => {
    const data = [
      { id: 1, tags: ['tag1', 'tag2'], name: 'Test' },
    ];
    
    // count is auto-calculated
    const result = encode(data);
    
    expect(result).toContain('schema{id,tags[],name}');
    expect(result).toContain('tag1|tag2');
  });
  
  it('should encode metadata with all fields', () => {
    const data = [{ id: 1 }];
    // count can be overridden if needed, but defaults to data.length
    const metadata = {
      count: 10, // Override count (e.g., for pagination where count is items per page)
      page: 2,
      pageCount: 5,
      total: 50,
    };
    
    const result = encode(data, metadata);
    expect(result).toContain('meta[10][2][5][50]');
  });
  
  it('should auto-calculate count from data.length', () => {
    const data = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ];
    
    // No metadata provided - count should be auto-calculated
    const result = encode(data);
    expect(result).toContain('meta[3]');
  });
  
  it('should handle empty data', () => {
    const data: Record<string, any>[] = [];
    
    // count auto-calculated as 0
    const result = encode(data);
    expect(result).toContain('JPACKED/1.1');
    expect(result).toContain('meta[0]');
    expect(result).toContain('data');
  });
  
  it('should handle special characters in CSV', () => {
    const data = [
      { name: 'John, Doe', description: 'He said "Hello"' },
    ];
    
    // count auto-calculated
    const result = encode(data);
    
    // Should contain quoted values
    expect(result).toContain('"John, Doe"');
    expect(result).toContain('"He said ""Hello"""');
  });
  
  it('should encode a single object (not an array)', () => {
    const data = { id: 1, name: 'Alice', age: 30 };
    
    // Single object should be converted to array automatically
    const result = encode(data);
    
    expect(result).toContain('JPACKED/1.1');
    expect(result).toContain('meta[1]'); // count = 1
    expect(result).toContain('schema{id,name,age}');
    expect(result).toContain('data');
    expect(result).toContain('1,Alice,30');
  });
});

