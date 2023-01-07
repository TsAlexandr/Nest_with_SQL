export class GetCommentByIdCommand {
  constructor(public readonly id: string, public readonly userId: string) {}
}
