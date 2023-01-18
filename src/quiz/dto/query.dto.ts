import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
enum PublishedStatus {
  all = 'all',
  published = 'published',
  notPublished = 'notPublished',
}

enum SortDirection {
  asc = 'asc',
  desc = 'desc',
}

export class QueryDto {
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
  readonly bodySearchTerm: string = '';
  @IsEnum(PublishedStatus)
  @IsOptional()
  readonly publishedStatus: PublishedStatus = PublishedStatus.all;
  @IsString()
  @IsOptional()
  readonly sortBy: string = 'createdAt';
  @Transform(({ value }) => value.toLowerCase())
  @IsEnum(SortDirection)
  @IsOptional()
  readonly sortDirection: SortDirection = SortDirection.desc;
  get skip(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
