import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentCommand } from '../commands/createComment.command';
import { CommentsRepository } from '../../public/comments/comments.repository';
import { v4 } from 'uuid';
import { UsersRepository } from '../../sa/users/users.repository';
import { ForbiddenException } from '@nestjs/common';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    private commentsRepository: CommentsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute(command: CreateCommentCommand) {
    const { postId, content, userId } = command;
    const bannedUser = await this.usersRepository.findById(userId);
    if (bannedUser.userId) throw new ForbiddenException();
    const newComment = {
      id: v4(),
      postId,
      content,
      userId,
      createdAt: new Date(),
    };
    return this.commentsRepository.createComment(newComment);
  }
}
