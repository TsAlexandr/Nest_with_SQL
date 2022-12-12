import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { BloggersDto } from './dto/bloggers.dto';
import { BlogsRepository } from './blogs.repository';

@Injectable()
export class BlogsService {
  constructor(private bloggersRepository: BlogsRepository) {}

  async getBloggers(
    page: number,
    pageSize: number,
    searchNameTerm: string,
    sortBy: string,
    sortDirection: number,
  ) {
    return await this.bloggersRepository.getBloggers(
      page,
      pageSize,
      searchNameTerm,
      sortBy,
      sortDirection,
    );
  }

  async getBloggerById(id: string) {
    return await this.bloggersRepository.getBloggersById(id);
  }

  async createBlogger(bloggersDto: BloggersDto, id: any, login: any) {
    const newBlogger = {
      id: uuidv4(),
      ...bloggersDto,
      createdAt: new Date().toISOString(),
      blogOwnerInfo: {
        userId: id,
        userLogin: login,
      },
    };
    return await this.bloggersRepository.createBlogger(newBlogger);
  }

  async updateBlogger(id: string, update: BloggersDto) {
    return await this.bloggersRepository.updateBloggerById(id, update);
  }

  async deleteBlogger(id: string): Promise<boolean> {
    return await this.bloggersRepository.deleteBloggerById(id);
  }

  bindWithUser(blogId: string, userId: string) {
    return this.bloggersRepository.bindWithUser(blogId, userId);
  }
}