/**
 * Metadata structure for JPACKED encoding
 * count is always present in decoded results, but optional when encoding (auto-calculated)
 */
export interface JPACKEDMetadata {
  count: number; // Always present in decoded results
  page?: number;
  pageCount?: number;
  total?: number;
}

/**
 * Optional metadata for encoding (count is auto-calculated from data.length)
 */
export interface EncodeMetadata {
  count?: number; // Optional, will be auto-calculated if not provided
  page?: number;
  pageCount?: number;
  total?: number;
}

/**
 * Schema field definition
 */
export interface SchemaField {
  name: string;
  isArray: boolean;
  children?: SchemaField[]; // For nested objects
}

/**
 * Options for encoding
 */
export interface EncodeOptions {
  metadata: JPACKEDMetadata;
}

/**
 * Result of decoding
 */
export interface DecodeResult<T = Record<string, any>> {
  data: T[];
  metadata: JPACKEDMetadata;
  schema: SchemaField[];
}

/**
 * Express Request extension for JPACKED body
 */
export interface JPACKEDRequest extends Express.Request {
  jpacked?: DecodeResult;
}

