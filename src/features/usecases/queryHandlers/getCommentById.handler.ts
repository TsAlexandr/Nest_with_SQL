import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCommentByIdCommand } from '../queryCommands/getCommentById.commmand';
import { CommentsRepository } from '../../public/comments/comments.repository';
import { NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../sa/users/users.repository';

@QueryHandler(GetCommentByIdCommand)
export class GetCommentByIdHandler
  implements IQueryHandler<GetCommentByIdCommand>
{
  constructor(
    private commentsRepository: CommentsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute(query: GetCommentByIdCommand) {
    let { id, userId } = query;
    if (!userId) {
      userId = '84a4fc41-3812-4456-9ff8-c108f47b13b8';
    }
    const comment = await this.commentsRepository.findComment(id, userId);
    if (!comment) throw new NotFoundException();
    return comment;
  }
}
