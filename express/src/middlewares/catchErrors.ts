import { Response } from 'express';
import { HttpError } from 'http-errors';

export function catchErrors(err: any, res: Response) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode || 500).json({
      message: err.message,
      code: err.statusCode,
    });
  }

  return res.status(500).json({
    message: err.toString(),
    stack: err.stack,
  });
}
