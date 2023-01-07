export class GetAllPostsCommand {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly sortBy: string,
    public readonly sortDirection: any,
    public readonly userId: string | null,
  ) {}
}
