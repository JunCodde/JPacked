/**
 * JPACKED - A compact data format alternative to JSON
 * Based on schema + CSV with metadata support
 * 
 * @packageDocumentation
 */

// Core functions
export { encode } from './encoder';
export { decode } from './decoder';

// Types
export type {
  JPACKEDMetadata,
  SchemaField,
  EncodeOptions,
  DecodeResult,
  JPACKEDRequest,
} from './types';

// Utils
export { encodeArray, decodeArray } from './utils/escape';
export { encodeCSVValue, parseCSVLine, encodeCSVLine } from './utils/csv';
export { parseMetadata, encodeMetadata } from './utils/meta';

// Middlewares
export { jpackedEncoder, type JPACKEDResponse } from './middleware/expressEncoder';
export { jpackedDecoder } from './middleware/expressDecoder';
export { decodeJPACKEDResponse, fetchJPACKED } from './middleware/fetchDecoder';

