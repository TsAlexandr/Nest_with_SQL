import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { BloggersDto } from './dto/bloggers.dto';
import { BlogsRepository } from './blogs.repository';
import { SortOrder } from 'mongoose';

@Injectable()
export class BlogsService {
  constructor(private bloggersRepository: BlogsRepository) {}

  async getBloggerById(id: string) {
    return await this.bloggersRepository.getBlogForValidation(id);
  }

  async createBlogger(bloggersDto: BloggersDto, userId: string) {
    const newBlogger = {
      id: uuidv4(),
      ...bloggersDto,
      createdAt: new Date(),
    };
    return await this.bloggersRepository.createBlogger(newBlogger, userId);
  }

  async updateBlogger(id: string, update: BloggersDto) {
    return await this.bloggersRepository.updateBloggerById(id, update);
  }

  async deleteBlogger(id: string): Promise<boolean> {
    return await this.bloggersRepository.deleteBloggerById(id);
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
  ) {
    return this.bloggersRepository.getBlogsByBlogger(
      page,
      pageSize,
      searchNameTerm,
      sortBy,
      sortDirection,
      userId,
    );
  }

  async validateBlogId(id: string) {
    return this.bloggersRepository.getBlogForValidation(id);
  }
}
