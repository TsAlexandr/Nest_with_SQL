import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentCommand } from '../commands/createComment.command';
import { CommentsRepository } from '../../public/comments/comments.repository';
import { v4 } from 'uuid';
import { BlogsRepository } from '../../public/blogs/blogs.repository';
import { ForbiddenException } from '@nestjs/common';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    private commentsRepository: CommentsRepository,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute(command: CreateCommentCommand) {
    const { postId, content, userId, blogId } = command;
    const isBannedUser = await this.blogsRepository.findBannedUser(
      blogId,
      userId,
    );
    if (isBannedUser) throw new ForbiddenException();
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
