import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentCommand } from '../commands/createComment.command';
import { CommentsRepository } from '../../public/comments/comments.repository';
import { v4 } from 'uuid';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(private commentsRepository: CommentsRepository) {}

  async execute(command: CreateCommentCommand) {
    const { postId, content, userId } = command;
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
