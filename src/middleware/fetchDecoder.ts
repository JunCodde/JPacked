import type { DecodeResult } from '../types';
import { decode } from '../decoder';

/**
 * Decodes a Response object if it contains JPACKED content
 * @param response Fetch Response object
 * @returns Promise that resolves to decoded JPACKED data or original response
 */
export async function decodeJPACKEDResponse<T = Record<string, any>>(
  response: Response
): Promise<DecodeResult<T> | Response> {
  const contentType = response.headers.get('Content-Type') || '';
  
  if (contentType.includes('application/jpacked')) {
    const text = await response.text();
    return decode<T>(text);
  }
  
  return response;
}

/**
 * Wraps fetch to automatically decode JPACKED responses
 * @param input URL or Request object
 * @param init Fetch options
 * @returns Promise that resolves to decoded JPACKED data or Response
 */
export async function fetchJPACKED<T = Record<string, any>>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<DecodeResult<T> | Response> {
  const response = await fetch(input, init);
  return decodeJPACKEDResponse<T>(response);
}

