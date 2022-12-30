import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBlogsByIdCommand } from '../queryCommands/getBlogsById.command';
import { BlogsRepository } from '../../public/blogs/blogs.repository';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetBlogsByIdCommand)
export class GetBlogsByIdHandler implements IQueryHandler<GetBlogsByIdCommand> {
  constructor(private blogsRepository: BlogsRepository) {}
  async execute(query: GetBlogsByIdCommand) {
    const { id } = query;
    const blog = await this.blogsRepository.getBlogsById(id);
    if (!blog) throw new NotFoundException();
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
    };
  }
}
