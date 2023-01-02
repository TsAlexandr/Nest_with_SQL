import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllBloggersBlogsCommand } from '../queryCommands/getAllBloggersBlogs.command';
import { NotFoundException } from '@nestjs/common';
import { BlogsRepository } from '../../public/blogs/blogs.repository';

@QueryHandler(GetAllBloggersBlogsCommand)
export class GetAllBloggersBlogsHandler
  implements IQueryHandler<GetAllBloggersBlogsCommand>
{
  constructor(private blogsRepository: BlogsRepository) {}
  async execute(query: GetAllBloggersBlogsCommand): Promise<any> {
    const { page, pageSize, searchNameTerm, sortBy, sortDirection, userId } =
      query;
    const bloggers = await this.blogsRepository.getBlogsByBlogger(
      page,
      pageSize,
      searchNameTerm,
      sortBy,
      sortDirection,
      userId,
    );
    if (!bloggers) {
      throw new NotFoundException();
    }
    return bloggers;
  }
}
