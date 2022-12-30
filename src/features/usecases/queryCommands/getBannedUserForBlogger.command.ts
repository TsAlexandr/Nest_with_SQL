export class GetBannedUserForBloggerCommand {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly sortBy: string,
    public readonly sortDirection: any,

    public readonly searchLoginTerm: string,
    public readonly blogId: string,
    public readonly ownerId: string,
  ) {}
}
