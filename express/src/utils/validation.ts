import { validate, ValidationError } from 'class-validator';
import { Response } from 'express';
import { plainToClass } from 'class-transformer';

export interface ValidationErrorI {
  validationProperty: string;
  validationErrors: string[];
}

export async function validation(
  validationCandidate,
  validationTarget,
): Promise<ValidationErrorI[]> {
  const candidate = plainToClass(validationTarget, validationCandidate);
  const errors: ValidationError[] = await validate(candidate, {
    whitelist: true,
  });

  if (errors.length) {
    return errors.map((err: ValidationError): ValidationErrorI => {
      return {
        validationProperty: err.property,
        validationErrors: Object.values(err.constraints),
      };
    });
  }
}

export function validationFail(errors: ValidationErrorI[], res: Response) {
  return res.status(400).json({
    status: 'fail',
    msg: 'Incorrect input data',
    data: errors,
  });
}
