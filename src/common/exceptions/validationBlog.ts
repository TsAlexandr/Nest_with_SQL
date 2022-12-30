import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../../features/public/blogs/blogs.repository';

@ValidatorConstraint({ name: 'blogId', async: true })
@Injectable()
export class BlogIdValidation implements ValidatorConstraintInterface {
  constructor(private blogsRepository: BlogsRepository) {}

  async validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> {
    const blogId = await this.blogsRepository.getBlogForValidation(value);
    if (!blogId) return false;
    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Blog doesn't exist";
  }
}
