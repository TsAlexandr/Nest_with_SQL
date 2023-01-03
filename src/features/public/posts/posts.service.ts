import { Injectable } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { PostsCon } from '../../../common/types/classes/classes';
import { v4 } from 'uuid';

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
    return this.postsRepository.createPosts(createPost);
  }

  async update(updPost: any) {
    return this.postsRepository.updatePost(updPost);
  }

  async remove(id: string) {
    return this.postsRepository.deletePost(id);
  }

  async updateActions(postId: string, likeStatus: string, userId: string) {
    return this.postsRepository.updateActions(postId, likeStatus, userId);
  }

  findAll(
    page: number,
    pageSize: number,
    userId,
    blogId: string,
    sortBy: any,
    sortDirection: string,
  ) {
    return;
  }
}
