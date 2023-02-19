import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryTopUsersDto {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly pageNumber: number = 1;
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  readonly pageSize: number = 10;
  @IsArray()
  @IsString()
  @IsOptional()
  readonly sort: string = 'avgScores desc, sumScore desc';
  get skip(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
