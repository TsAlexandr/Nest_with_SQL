import { SortOrder } from 'mongoose';

export class GetAllBlogsCommand {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly searchNameTerm: string,
    public readonly sortBy: string,
    public readonly sortDirection: any,
  ) {}
}
