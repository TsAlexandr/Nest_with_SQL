import { SortOrder } from 'mongoose';

export class GetCommentsCommand {
  constructor(
    public readonly postId: string,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly userId: string,
    public readonly sortBy: string,
    public readonly sortDirection: any,
  ) {}
}
