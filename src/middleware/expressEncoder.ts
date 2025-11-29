import type { Response } from 'express';
import type { EncodeMetadata } from '../types';
import { encode } from '../encoder';

/**
 * Express response extension for JPACKED encoding
 */
export interface JPACKEDResponse extends Response {
  jpacked: (data: Record<string, any>[] | Record<string, any>, metadata?: EncodeMetadata) => void;
}

/**
 * Middleware to add jpacked() method to Express response
 * Usage: app.use(jpackedEncoder());
 */
export function jpackedEncoder() {
  return (_req: any, res: Response, next: () => void) => {
    (res as JPACKEDResponse).jpacked = function (
      data: Record<string, any>[] | Record<string, any>,
      metadata?: EncodeMetadata
    ) {
      this.setHeader('Content-Type', 'application/jpacked');
      const encoded = encode(data, metadata);
      this.send(encoded);
    };
    
    next();
  };
}

