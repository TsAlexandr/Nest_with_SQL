import { SortOrder } from 'mongoose';

export class GetAllBloggerCommentsCommand {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly sortBy: string,
    public readonly sortDirection: any,
    public readonly ownerId: string,
  ) {}
}
