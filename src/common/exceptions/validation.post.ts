import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../../features/public/posts/posts.repository';

@ValidatorConstraint({ name: 'postId', async: true })
@Injectable()
export class ValidationPost implements ValidatorConstraintInterface {
  constructor(private postsRepository: PostsRepository) {}

  async validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> {
    const postId = await this.postsRepository.getPostById(value, null);
    if (!postId) return false;
    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Post doesn't exist";
  }
}
