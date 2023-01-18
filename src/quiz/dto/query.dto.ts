import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
enum PublishedStatus {
  all = 'all',
  published = 'published',
  notPublished = 'notPublished',
}

enum SortDirection {
  asc = 'ASC',
  desc = 'DESC',
}

export class QueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly pageNumber: number = 1;
  @IsInt()
  @Min(1)
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
  @IsEnum(SortDirection)
  @IsOptional()
  readonly sortDirection: SortDirection = SortDirection.desc;
  get skip(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
