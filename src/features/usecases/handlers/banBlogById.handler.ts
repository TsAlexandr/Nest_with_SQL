import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BanBlogByIdCommand } from '../commands/banBlogById.command';
import { BlogsRepository } from '../../public/blogs/blogs.repository';
import { NotFoundException } from '@nestjs/common';

@CommandHandler(BanBlogByIdCommand)
export class BanBlogByIdHandler implements ICommandHandler<BanBlogByIdCommand> {
  constructor(private blogsRepository: BlogsRepository) {}
  async execute(command: BanBlogByIdCommand): Promise<any> {
    const { id, isBanned } = command;
    const blog = await this.blogsRepository.getBlogForValidation(id);
    console.log(blog);
    if (!blog) throw new NotFoundException();
    await this.blogsRepository.banBlogById(id, isBanned);
  }
}
