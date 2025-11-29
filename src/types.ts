/**
 * Metadata structure for JPACKED encoding
 */
export interface JPACKEDMetadata {
  count: number;
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

