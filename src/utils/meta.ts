import type { JPACKEDMetadata } from '../types';

/**
 * Metadata parsing utilities for JPACKED
 * 
 * Format: meta[COUNT][PAGE?][PAGE_COUNT?][TOTAL?]
 */

/**
 * Parses a metadata line into JPACKEDMetadata object
 * @param line Metadata line (e.g., "meta[20][1][5][200]")
 * @returns Parsed metadata object
 * @throws Error if format is invalid
 */
export function parseMetadata(line: string): JPACKEDMetadata {
  const match = line.match(/^meta\[(\d+)\](?:\[(\d+)\])?(?:\[(\d+)\])?(?:\[(\d+)\])?$/);
  
  if (!match) {
    throw new Error(`Invalid metadata format: ${line}`);
  }
  
  const metadata: JPACKEDMetadata = {
    count: parseInt(match[1], 10),
  };
  
  if (match[2] !== undefined) {
    metadata.page = parseInt(match[2], 10);
  }
  
  if (match[3] !== undefined) {
    metadata.pageCount = parseInt(match[3], 10);
  }
  
  if (match[4] !== undefined) {
    metadata.total = parseInt(match[4], 10);
  }
  
  return metadata;
}

/**
 * Encodes metadata object into JPACKED metadata line
 * @param metadata Metadata object
 * @returns Encoded metadata line
 */
export function encodeMetadata(metadata: JPACKEDMetadata): string {
  const parts: string[] = [metadata.count.toString()];
  
  if (metadata.page !== undefined) {
    parts.push(metadata.page.toString());
    
    if (metadata.pageCount !== undefined) {
      parts.push(metadata.pageCount.toString());
      
      if (metadata.total !== undefined) {
        parts.push(metadata.total.toString());
      }
    }
  }
  
  return `meta[${parts.join('][')}]`;
}

