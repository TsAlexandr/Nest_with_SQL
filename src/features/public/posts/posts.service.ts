import { Injectable } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { PostsCon } from '../../../common/types/classes/classes';
import { v4 } from 'uuid';
import { PostsRepositoryRAW } from '../../../library/rawDb/postsRepositoryRAW';
import { SortOrder } from 'mongoose';

@Injectable()
export class PostsService {
  constructor(private postsRepository: PostsRepository) {}

  async findAll(
    page: number,
    pageSize: number,
    userId: string,
    blogId: string | null,
    searchNameTerm: string,
    sortBy: string,
    sortDirection: any,
  ) {
    return await this.postsRepository.getPosts(
      page,
      pageSize,
      userId,
      blogId,
      searchNameTerm,
      sortBy,
      sortDirection,
    );
  }

  async findOne(id: string, userId: string) {
    return this.postsRepository.getPostById(id, userId);
  }

  async create(newPost: any, blogName: string): Promise<PostsCon> {
    const createPost = {
      id: v4(),
      title: newPost.title,
      shortDescription: newPost.shortDescription,
      content: newPost.content,
      blogId: newPost.blogId,
      blogName: blogName,
      createdAt: new Date(),
    };
    return await this.postsRepository.createPosts(createPost);
  }

  async update(updPost: any) {
    return await this.postsRepository.updatePost(updPost);
  }

  async remove(id: string) {
    return await this.postsRepository.deletePost(id);
  }

  /*async updateActions(
    postId: string,
    likeStatus: string,
    userId: string,
    login: string,
  ) {
    return await this.postsRepository.updateActions(
      postId,
      likeStatus,
      userId,
      login,
    );
  }*/
}
