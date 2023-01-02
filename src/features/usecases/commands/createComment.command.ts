export class CreateCommentCommand {
  constructor(
    public readonly postId: string,
    public readonly content: string,
    public readonly userId: string,
  ) {}
}
