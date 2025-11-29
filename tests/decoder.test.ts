import { describe, it, expect } from 'vitest';
import { decode } from '../src/decoder';

describe('Decoder', () => {
  it('should decode simple data', () => {
    const jpacked = `JPACKED/1.1
meta[2]
schema{id,name,age}
data
1,Alice,30
2,Bob,25`;
    
    const result = decode(jpacked);
    
    expect(result.metadata.count).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({ id: 1, name: 'Alice', age: 30 });
    expect(result.data[1]).toEqual({ id: 2, name: 'Bob', age: 25 });
  });
  
  it('should decode data with arrays', () => {
    const jpacked = `JPACKED/1.1
meta[1]
schema{id,tags[],name}
data
1,tag1|tag2,Test`;
    
    const result = decode(jpacked);
    
    expect(result.data[0].tags).toEqual(['tag1', 'tag2']);
  });
  
  it('should decode metadata with all fields', () => {
    const jpacked = `JPACKED/1.1
meta[10][2][5][50]
schema{id}
data
1`;
    
    const result = decode(jpacked);
    
    expect(result.metadata.count).toBe(10);
    expect(result.metadata.page).toBe(2);
    expect(result.metadata.pageCount).toBe(5);
    expect(result.metadata.total).toBe(50);
  });
  
  it('should handle empty data', () => {
    const jpacked = `JPACKED/1.1
meta[0]
schema{}
data`;
    
    const result = decode(jpacked);
    
    expect(result.metadata.count).toBe(0);
    expect(result.data).toHaveLength(0);
  });
  
  it('should throw error on invalid header', () => {
    const jpacked = `INVALID/1.0
meta[1]
schema{id}
data
1`;
    
    expect(() => decode(jpacked)).toThrow('Invalid JPACKED header');
  });
  
  it('should throw error on invalid metadata', () => {
    const jpacked = `JPACKED/1.1
invalid
schema{id}
data
1`;
    
    expect(() => decode(jpacked)).toThrow('Invalid metadata format');
  });
  
  it('should handle quoted CSV values', () => {
    const jpacked = `JPACKED/1.1
meta[1]
schema{name,description}
data
"John, Doe","He said ""Hello"""`;
    
    const result = decode(jpacked);
    
    expect(result.data[0].name).toBe('John, Doe');
    expect(result.data[0].description).toBe('He said "Hello"');
  });
  
  it('should convert numeric strings to numbers', () => {
    const jpacked = `JPACKED/1.1
meta[1]
schema{id,price}
data
1,99.99`;
    
    const result = decode(jpacked);
    
    expect(typeof result.data[0].id).toBe('number');
    expect(typeof result.data[0].price).toBe('number');
  });
  
  it('should convert boolean strings', () => {
    const jpacked = `JPACKED/1.1
meta[1]
schema{active,verified}
data
true,false`;
    
    const result = decode(jpacked);
    
    expect(result.data[0].active).toBe(true);
    expect(result.data[0].verified).toBe(false);
  });
});

