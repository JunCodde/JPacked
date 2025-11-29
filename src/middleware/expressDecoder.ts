import type { Request, Response, NextFunction } from 'express';
import type { JPACKEDRequest } from '../types';
import { decode } from '../decoder';

/**
 * Express middleware to parse JPACKED request body
 * 
 * IMPORTANT: This middleware must be used BEFORE express.json() or express.text()
 * to properly capture the raw body.
 * 
 * Usage:
 * ```typescript
 * app.use(express.text({ type: 'application/jpacked' }));
 * app.use(jpackedDecoder());
 * ```
 */
export function jpackedDecoder() {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.get('Content-Type') || '';
    
    if (contentType.includes('application/jpacked')) {
      // Try to get body from req.body (if express.text was used)
      let bodyText: string;
      
      if (typeof req.body === 'string') {
        bodyText = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        bodyText = req.body.toString('utf8');
      } else {
        // Fallback: try to read from stream
        return next(new Error('JPACKED body not available. Use express.text() middleware before jpackedDecoder()'));
      }
      
      try {
        const decoded = decode(bodyText);
        (req as JPACKEDRequest).jpacked = decoded;
        next();
      } catch (error) {
        next(error);
      }
    } else {
      next();
    }
  };
}

