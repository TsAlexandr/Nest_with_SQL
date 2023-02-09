import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SortDirection } from '../../dto/query.dto';

export class PairQueryDto {
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
  @IsString()
  @IsOptional()
  readonly sortBy: string = 'pairCreatedDate';
  @Transform(({ value }) => value.toLowerCase())
  @IsEnum(SortDirection)
  @IsOptional()
  readonly sortDirection: SortDirection = SortDirection.desc;
  get skip(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
