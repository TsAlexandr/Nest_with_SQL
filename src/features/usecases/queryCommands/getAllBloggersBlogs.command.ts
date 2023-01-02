export class GetAllBloggersBlogsCommand {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly searchNameTerm: string,
    public readonly sortBy: string,
    public readonly sortDirection: any,
    public readonly userId: string,
  ) {}
}
