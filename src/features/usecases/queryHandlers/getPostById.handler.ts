import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetPostByIdCommand } from '../queryCommands/getPostById.command';
import { PostsRepository } from '../../public/posts/posts.repository';

@QueryHandler(GetPostByIdCommand)
export class GetPostByIdHandler implements IQueryHandler<GetPostByIdCommand> {
  constructor(private postsRepository: PostsRepository) {}

  async execute(command: GetPostByIdCommand) {
    let { id, userId } = command;
    if (!userId) {
      userId = '84a4fc41-3812-4456-9ff8-c108f47b13b8';
    }
    const post = await this.postsRepository.getPostById(id, userId);
    if (!post) throw new NotFoundException();
    return post;
  }
}
