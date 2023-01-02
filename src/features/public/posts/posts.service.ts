import { Injectable } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { PostsCon } from '../../../common/types/classes/classes';
import { v4 } from 'uuid';
import { PostsRepositoryRAW } from '../../../library/rawDb/postsRepositoryRAW';
import { SortOrder } from 'mongoose';

@Injectable()
export class PostsService {
  constructor(private postsRepository: PostsRepository) {}

  async findOne(id: string, userId: string) {
    return this.postsRepository.getPostById(id, userId);
  }

  async create(newPost: any): Promise<PostsCon> {
    const createPost = {
      id: v4(),
      title: newPost.title,
      shortDescription: newPost.shortDescription,
      content: newPost.content,
      blogId: newPost.blogId,
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

  async updateActions(postId: string, likeStatus: string, userId: string) {
    return await this.postsRepository.updateActions(postId, likeStatus, userId);
  }
}
