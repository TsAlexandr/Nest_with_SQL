import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { BloggersDto } from './dto/bloggers.dto';
import { BlogsRepository } from './blogs.repository';
import { SortOrder } from 'mongoose';

@Injectable()
export class BlogsService {
  constructor(private bloggersRepository: BlogsRepository) {}

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
      banInfo: {
        isBanned: false,
        banDate: null,
      },
      blackList: [],
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

  async getBlogsWithOwnerInfo(
    page: number,
    pageSize: number,
    searchNameTerm: string,
    sortBy: string,
    sortDirection: any,
  ) {
    return this.bloggersRepository.getBlogsWithOwnerInfo(
      page,
      pageSize,
      searchNameTerm,
      sortBy,
      sortDirection,
    );
  }

  async getBlogsByBlogger(
    page: number,
    pageSize: number,
    searchNameTerm: string,
    sortBy: string,
    sortDirection: any,
    userId: string,
    login: string,
  ) {
    return this.bloggersRepository.getBlogsByBlogger(
      page,
      pageSize,
      searchNameTerm,
      sortBy,
      sortDirection,
      userId,
      login,
    );
  }
}
