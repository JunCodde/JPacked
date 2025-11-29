import { describe, it, expect } from 'vitest';
import { extractNestedSchema, encodeNestedSchema, parseNestedSchema, flattenSchema } from '../src/utils/schema';

describe('Schema Utilities', () => {
  it('should extract nested schema correctly', () => {
    const obj = {
      id: 1,
      name: 'Test',
      profile: {
        email: 'test@example.com',
        settings: {
          theme: 'dark',
        },
      },
      tags: ['tag1', 'tag2'],
    };

    const schema = extractNestedSchema(obj);
    
    expect(schema).toHaveLength(4);
    expect(schema[0].name).toBe('id');
    expect(schema[1].name).toBe('name');
    expect(schema[2].name).toBe('profile');
    expect(schema[2].children).toBeDefined();
    expect(schema[2].children![0].name).toBe('email');
    expect(schema[2].children![1].name).toBe('settings');
    expect(schema[2].children![1].children).toBeDefined();
    expect(schema[3].name).toBe('tags');
    expect(schema[3].isArray).toBe(true);
  });

  it('should encode nested schema correctly', () => {
    const schema = [
      { name: 'id', isArray: false },
      { name: 'profile', isArray: false, children: [
        { name: 'email', isArray: false },
        { name: 'settings', isArray: false, children: [
          { name: 'theme', isArray: false },
        ]},
      ]},
      { name: 'tags', isArray: true },
    ];

    const encoded = encodeNestedSchema(schema);
    expect(encoded).toBe('id,profile{email,settings{theme}},tags[]');
  });

  it('should parse nested schema correctly', () => {
    const schemaStr = 'id,profile{email,settings{theme}},tags[]';
    const parsed = parseNestedSchema(schemaStr);
    
    expect(parsed).toHaveLength(3);
    expect(parsed[0].name).toBe('id');
    expect(parsed[1].name).toBe('profile');
    expect(parsed[1].children).toBeDefined();
    expect(parsed[1].children![0].name).toBe('email');
    expect(parsed[1].children![1].name).toBe('settings');
    expect(parsed[1].children![1].children).toBeDefined();
    expect(parsed[2].name).toBe('tags');
    expect(parsed[2].isArray).toBe(true);
  });

  it('should flatten nested schema correctly', () => {
    const schema = [
      { name: 'id', isArray: false },
      { name: 'profile', isArray: false, children: [
        { name: 'email', isArray: false },
        { name: 'settings', isArray: false, children: [
          { name: 'theme', isArray: false },
        ]},
      ]},
      { name: 'tags', isArray: true },
    ];

    const flat = flattenSchema(schema);
    
    expect(flat).toHaveLength(4);
    expect(flat[0].name).toBe('id');
    expect(flat[1].name).toBe('profile.email');
    expect(flat[2].name).toBe('profile.settings.theme');
    expect(flat[3].name).toBe('tags');
    expect(flat[3].isArray).toBe(true);
  });
});

