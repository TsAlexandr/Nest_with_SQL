export class GetPostByIdCommand {
  constructor(public readonly id: string, public readonly userId: string) {}
}
