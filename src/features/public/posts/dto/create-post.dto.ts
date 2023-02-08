import { IsNotEmpty, IsString, Length, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { BlogIdValidation } from '../../../../common/exceptions/validationBlog';

export class CreatePostDto {
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @Length(1, 30)
  title: string;

  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @Length(1, 100)
  shortDescription: string;

  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @Length(1, 1000)
  content: string;

  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @Length(1)
  @Validate(BlogIdValidation)
  blogId: string;
}

export class NewPost {
  @IsString()
  @Length(1, 30)
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  title: string;
  @IsString()
  @Length(1, 100)
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  shortDescription: string;
  @IsString()
  @Length(1, 1000)
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  content: string;
}
