import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBannedUserForBloggerCommand } from '../queryCommands/getBannedUserForBlogger.command';
import { BlogsRepository } from '../../public/blogs/blogs.repository';
import { ForbiddenException } from '@nestjs/common';

@QueryHandler(GetBannedUserForBloggerCommand)
export class GetBannedUserForBloggerHandler
  implements IQueryHandler<GetBannedUserForBloggerCommand>
{
  constructor(private blogsRepository: BlogsRepository) {}
  async execute(query: GetBannedUserForBloggerCommand) {
    const {
      page,
      pageSize,
      sortBy,
      sortDirection,
      searchLoginTerm,
      blogId,
      ownerId,
    } = query;
    const owner = await this.blogsRepository.getOwnerBlogId(ownerId, blogId);
    const users = await this.blogsRepository.getBannedUsers(
      page,
      pageSize,
      sortBy,
      sortDirection,
      searchLoginTerm,
      blogId,
    );
    if (!owner) throw new ForbiddenException();
    return users;
  }
}
