import { validate, ValidationError } from 'class-validator';
import { Response } from 'express';
import { plainToClass } from 'class-transformer';
import { ValidatorOptions } from 'class-validator/types/validation/ValidatorOptions';

export interface ValidationErrorI {
  validationProperty: string;
  validationErrors: string[];
}

export async function validation(
  validationCandidate,
  validationTarget,
  res: Response,
  partial?: boolean,
) {
  const candidate = plainToClass(validationTarget, validationCandidate);
  const validatorOpts: ValidatorOptions = {
    whitelist: true,
  };
  if (partial) validatorOpts.skipMissingProperties = true;

  const errors: ValidationError[] = await validate(candidate, validatorOpts);

  if (errors.length) {
    const foundErrors: ValidationErrorI[] = errors.map(
      (err: ValidationError): ValidationErrorI => {
        return {
          validationProperty: err.property,
          validationErrors: Object.values(err.constraints),
        };
      },
    );
    return validationFail(foundErrors, res);
  }
}

export function validationFail(errors: ValidationErrorI[], res: Response) {
  return res.status(400).json({
    status: 'fail',
    msg: 'Incorrect input data',
    errors,
  });
}
