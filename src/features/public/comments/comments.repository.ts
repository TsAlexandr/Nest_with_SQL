import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class CommentsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findComment(commentId: string) {
    const query = await this.dataSource.query(
      `
    SELECT * FROM public.comments
    WHERE id = $1`,
      [commentId],
    );
    return query[0];
  }
  async getCommentWithPage(
    postId: string,
    page: number,
    pageSize: number,
    userId: string,
    sortBy: string,
    sortDirection: any,
  ) {
    const query = await this.dataSource.query(
      `
    SELECT * FROM public.comments
    WHERE "postId" = $1`,
      [postId],
    );
    return query[0];
  }

  async createComment(newComment: any) {
    const query = await this.dataSource.query(
      `
    INSERT INTO public.comments
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, content, "createdAt", "postId", "userId"`,
      [
        newComment.id,
        newComment.content,
        newComment.createdAt,
        newComment.postId,
        newComment.userId,
      ],
    );
    return query[0];
  }

  async updateComment(id: string, content: string) {
    return this.dataSource.query(
      `
    UPDATE public.comments
    SET content = $1
    WHERE id = $2`,
      [content, id],
    );
  }

  async deleteComment(id: string) {
    return this.dataSource.query(
      `
    DELETE FROM public.comments
    WHERE id = $1`,
      [id],
    );
  }

  async updateLikes(
    commentId: string,
    status: string,
    userId: string,
    createdAt: Date,
  ) {
    if (status === 'Like' || status === 'Dislike' || status === 'None') {
      await this.dataSource.query(
        `
      DELETE FROM public.actions
      WHERE "userId" = $1 AND "parentId" = $2 AND "parentType" = 'comment'`,
        [userId, commentId],
      );
    }
    if (status === 'Like' || status === 'Dislike') {
      return this.dataSource.query(
        `
      UPDATE public.actions
      SET action = $1, "addedAt" = $2
      WHERE "userId" = $3 
        AND "parentId" = $4 
          AND "parentType" = 'comment'`,
        [status, createdAt, userId, commentId],
      );
    }
  }

  async getBlogsWithPostsAndComments(
    page: number,
    pageSize: number,
    sortBy: string,
    sortDirection: any,
    ownerId: string,
  ) {
    const query = await this.dataSource.query(
      `
    SELECT * FROM public.comments
    WHERE "blogId" = $1`,
      [ownerId],
    );
    return query[0];
  }
}
