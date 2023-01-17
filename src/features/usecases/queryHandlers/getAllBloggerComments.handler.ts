import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllBloggerCommentsCommand } from '../queryCommands/getAllBloggerComments.command';
import { CommentsRepository } from '../../public/comments/comments.repository';

@QueryHandler(GetAllBloggerCommentsCommand)
export class GetAllBloggerCommentsHandler
  implements IQueryHandler<GetAllBloggerCommentsCommand>
{
  constructor(private commentsRepository: CommentsRepository) {}
  async execute(query: GetAllBloggerCommentsCommand) {
    const { page, pageSize, sortBy, sortDirection, ownerId } = query;
    const currentBlog =
      await this.commentsRepository.getBlogsWithPostsAndComments(
        page,
        pageSize,
        sortBy,
        sortDirection,
        ownerId,
      );
    return currentBlog;
  }
}
