import { validate, ValidationError } from 'class-validator';
import { NextFunction, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { ValidatorOptions } from 'class-validator/types/validation/ValidatorOptions';
import { User } from '../models/user.model';

interface ValidationErrorI {
  validationProperty: string;
  validationErrors: string[];
}

class Validation {
  target: any;

  validationCandidate: any;

  res: Response;

  req: Request;

  next: NextFunction;

  validationOpts: ValidatorOptions;

  constructor(req, res, next, target, partial?: boolean) {
    this.res = res;
    this.req = req;
    this.next = next;
    this.target = target;
    this.validationOpts = { whitelist: true };
    if (partial) this.validationOpts.skipMissingProperties = true;
    this.validationCandidate = plainToClass(this.target, this.req.body);
  }

  public async validate() {
    const errors: ValidationError[] = await validate(
      this.validationCandidate,
      this.validationOpts,
    );

    if (errors.length) {
      const foundErrors: ValidationErrorI[] = errors.map(
        (err: ValidationError): ValidationErrorI => {
          return {
            validationProperty: err.property,
            validationErrors: Object.values(err.constraints),
          };
        },
      );

      return Validation.validationFail(foundErrors, this.res);
    }

    return Validation.validationSuccess(this.next);
  }

  private static validationSuccess(next: NextFunction) {
    next();
  }

  private static validationFail(errors: ValidationErrorI[], res: Response) {
    return res.status(400).json({
      status: 'fail',
      msg: 'Incorrect input data',
      errors,
    });
  }
}

export function userPartialValidate(req, res, next) {
  return new Validation(req, res, next, User, true).validate();
}

export function userFullValidate(req, res, next) {
  return new Validation(req, res, next, User).validate();
}
