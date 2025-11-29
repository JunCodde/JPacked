import { describe, it, expect } from 'vitest';
import { encode } from '../src/encoder';
import type { JPACKEDMetadata } from '../src/types';

describe('Encoder', () => {
  it('should encode simple data', () => {
    const data = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ];
    
    const metadata: JPACKEDMetadata = { count: 2 };
    const result = encode(data, metadata);
    
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
    
    const metadata: JPACKEDMetadata = { count: 1 };
    const result = encode(data, metadata);
    
    expect(result).toContain('schema{id,tags[],name}');
    expect(result).toContain('tag1|tag2');
  });
  
  it('should encode metadata with all fields', () => {
    const data = [{ id: 1 }];
    const metadata: JPACKEDMetadata = {
      count: 10,
      page: 2,
      pageCount: 5,
      total: 50,
    };
    
    const result = encode(data, metadata);
    expect(result).toContain('meta[10][2][5][50]');
  });
  
  it('should handle empty data', () => {
    const data: Record<string, any>[] = [];
    const metadata: JPACKEDMetadata = { count: 0 };
    
    const result = encode(data, metadata);
    expect(result).toContain('JPACKED/1.1');
    expect(result).toContain('meta[0]');
    expect(result).toContain('data');
  });
  
  it('should handle special characters in CSV', () => {
    const data = [
      { name: 'John, Doe', description: 'He said "Hello"' },
    ];
    
    const metadata: JPACKEDMetadata = { count: 1 };
    const result = encode(data, metadata);
    
    // Should contain quoted values
    expect(result).toContain('"John, Doe"');
    expect(result).toContain('"He said ""Hello"""');
  });
});

