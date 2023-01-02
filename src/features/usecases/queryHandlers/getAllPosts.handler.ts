import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllPostsCommand } from '../queryCommands/getAllPosts.command';
import { PostsRepository } from '../../public/posts/posts.repository';

@QueryHandler(GetAllPostsCommand)
export class GetAllPostsHandler implements IQueryHandler<GetAllPostsCommand> {
  constructor(private postsRepository: PostsRepository) {}
  async execute(query: GetAllPostsCommand): Promise<any> {
    const { page, pageSize, sortBy, sortDirection, userId } = query;
    const result = await this.postsRepository.getPosts(
      page,
      pageSize,
      sortBy,
      sortDirection,
      userId,
    );
    return result;
  }
}
