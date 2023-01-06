import { Injectable } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { v4 } from 'uuid';
import { SortOrder } from 'mongoose';

@Injectable()
export class CommentsService {
  constructor(private commentsRepository: CommentsRepository) {}

  async findComment(commentId: string) {
    return await this.commentsRepository.findComment(commentId, null);
  }

  async updateComment(id: string, content: string) {
    return await this.commentsRepository.updateComment(id, content);
  }

  async deleteComment(id: string) {
    return await this.commentsRepository.deleteComment(id);
  }

  async updateLikes(commentId: string, status: string, userId: string) {
    const date = new Date();
    return this.commentsRepository.updateLikes(commentId, status, userId, date);
  }
}
