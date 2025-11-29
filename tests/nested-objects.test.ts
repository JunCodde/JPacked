import { describe, it, expect } from 'vitest';
import { encode } from '../src/encoder';
import { decode } from '../src/decoder';
import type { JPACKEDMetadata } from '../src/types';

describe('Nested Objects in Arrays', () => {
  it('should encode and decode objects in arrays using CSV format', () => {
    const data = [
      {
        id: 1,
        name: 'Test',
        items: [{ name: 'item1', value: 100 }, { name: 'item2', value: 200 }],
      },
    ];

    const metadata: JPACKEDMetadata = { count: 1 };
    const encoded = encode(data, metadata);
    const decoded = decode(encoded);

    // Objects should be preserved
    expect(decoded.data[0].items).toEqual([
      { name: 'item1', value: 100 },
      { name: 'item2', value: 200 },
    ]);
    
    // Schema should be items[name,value] (not items[]{name,value})
    expect(encoded).toContain('items[name,value]');
    // Data should be CSV format: item1,100|item2,200
    expect(encoded).toMatch(/item1,100\|item2,200/);
  });

  it('should handle mixed arrays (strings, numbers, objects)', () => {
    const data = [
      {
        id: 1,
        mixed: [
          'string',
          123,
          { name: 'object', value: 456 },
          true,
          false,
        ],
      },
    ];

    const metadata: JPACKEDMetadata = { count: 1 };
    const encoded = encode(data, metadata);
    const decoded = decode(encoded);

    expect(decoded.data[0].mixed).toEqual([
      'string',
      123,
      { name: 'object', value: 456 },
      true,
      false,
    ]);
  });

  it('should handle objects with nested arrays inside arrays', () => {
    const data = [
      {
        id: 1,
        configs: [
          {
            tags: ['tag1', 'tag2'],
            settings: { enabled: true, count: 5 },
          },
        ],
      },
    ];

    const metadata: JPACKEDMetadata = { count: 1 };
    const encoded = encode(data, metadata);
    const decoded = decode(encoded);

    // Objects in arrays are preserved using JPACKED format
    expect(decoded.data[0].configs).toEqual([
      {
        tags: ['tag1', 'tag2'],
        settings: { enabled: true, count: 5 },
      },
    ]);
  });

  it('should handle nested objects directly (not in arrays)', () => {
    const data = [
      {
        id: 1,
        name: 'Test',
        config: {
          enabled: true,
          settings: {
            theme: 'dark',
            language: 'es',
          },
        },
        metadata: {
          tags: ['tag1', 'tag2'],
          count: 5,
        },
      },
    ];

    const metadata: JPACKEDMetadata = { count: 1 };
    const encoded = encode(data, metadata);
    const decoded = decode(encoded);

    // Nested objects should be preserved
    expect(decoded.data[0].config).toEqual({
      enabled: true,
      settings: {
        theme: 'dark',
        language: 'es',
      },
    });
    expect(decoded.data[0].metadata).toEqual({
      tags: ['tag1', 'tag2'],
      count: 5,
    });
  });

  it('should handle deeply nested objects', () => {
    const data = [
      {
        id: 1,
        user: {
          profile: {
            personal: {
              name: 'John',
              age: 30,
            },
            preferences: {
              theme: 'dark',
            },
          },
        },
      },
    ];

    const metadata: JPACKEDMetadata = { count: 1 };
    const encoded = encode(data, metadata);
    const decoded = decode(encoded);

    expect(decoded.data[0].user.profile.personal.name).toBe('John');
    expect(decoded.data[0].user.profile.personal.age).toBe(30);
    expect(decoded.data[0].user.profile.preferences.theme).toBe('dark');
  });

  it('should handle mixed nested objects and arrays', () => {
    const data = [
      {
        id: 1,
        config: {
          enabled: true,
          items: ['item1', 'item2'],
        },
        tags: [
          { name: 'tag1', value: 1 },
          { name: 'tag2', value: 2 },
        ],
      },
    ];

    const metadata: JPACKEDMetadata = { count: 1 };
    const encoded = encode(data, metadata);
    const decoded = decode(encoded);

    expect(decoded.data[0].config).toEqual({
      enabled: true,
      items: ['item1', 'item2'],
    });
    expect(decoded.data[0].tags).toEqual([
      { name: 'tag1', value: 1 },
      { name: 'tag2', value: 2 },
    ]);
  });

  it('should handle objects with special characters in arrays', () => {
    const data = [
      {
        id: 1,
        items: [
          { name: 'item|with|pipes', value: 100 },
          { name: 'item\\with\\backslashes', value: 200 },
        ],
      },
    ];

    const metadata: JPACKEDMetadata = { count: 1 };
    const encoded = encode(data, metadata);
    const decoded = decode(encoded);

    expect(decoded.data[0].items).toEqual([
      { name: 'item|with|pipes', value: 100 },
      { name: 'item\\with\\backslashes', value: 200 },
    ]);
  });
});

