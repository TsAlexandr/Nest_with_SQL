import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCommentByIdCommand } from '../queryCommands/getCommentById.commmand';
import { CommentsRepository } from '../../public/comments/comments.repository';
import { NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../sa/users/users.repository';

@QueryHandler(GetCommentByIdCommand)
export class GetCommentByIdHandler
  implements IQueryHandler<GetCommentByIdCommand>
{
  constructor(private commentsRepository: CommentsRepository) {}

  async execute(query: GetCommentByIdCommand) {
    const { id, userId } = query;
    const comment = await this.commentsRepository.findComment(id, userId);
    return comment;
  }
}
