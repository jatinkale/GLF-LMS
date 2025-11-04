import { Request, Response, NextFunction } from 'express';

// Sanitize string to prevent XSS attacks
const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return str;

  return str
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
};

// Recursively sanitize object
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  return obj;
};

// Input sanitization middleware
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query params
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Whitelist specific fields (allow HTML/special characters)
export const whitelistFields = (...fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalBody = { ...req.body };

    // Sanitize body normally
    req.body = sanitizeObject(req.body);

    // Restore whitelisted fields
    fields.forEach(field => {
      if (originalBody[field] !== undefined) {
        req.body[field] = originalBody[field];
      }
    });

    next();
  };
};
