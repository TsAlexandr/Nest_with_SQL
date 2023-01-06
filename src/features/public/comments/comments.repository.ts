import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class CommentsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findComment(commentId: string, userId: string) {
    const query = await this.dataSource.query(
      `
    SELECT c.*, u.login as "userLogin", 
        (SELECT ROW_TO_JSON(actions_info) FROM 
            (SELECT * FROM (SELECT COUNT(*) as "likesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId"
                WHERE a.action = 'Like' AND ban."isBanned" = false
                AND a."parentId" = c.id) as "likesCount",
            (SELECT COUNT(*) as "dislikesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId" 
                WHERE a.action = 'Dislike' AND ban."isBanned" = false
                AND a."parentId" = c.id) as "dislikesCount",
            COALESCE((SELECT a."action" as "myStatus" 
                FROM actions a
                WHERE a."userId" = $2
                AND a."parentType" = 'post' 
                AND a."parentId" = c.id), 'None') as "myStatus"
                ) actions_info ) as "likesInfo" 
    FROM public.comments c
    LEFT JOIN public.users u
    ON u.id = c."userId"
    LEFT JOIN public.posts p
    ON p.id = c."postId"
    LEFT JOIN public.blogs b
    ON b.id = p."blogId"
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE c.id = $1 AND ban."isBanned" = false
    `,
      [commentId, userId],
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
    const dynamicSort = `p."${sortBy}"`;
    const query = await this.dataSource.query(
      `
    SELECT c.*, u.login as "userLogin", 
        (SELECT ROW_TO_JSON(actions_info) FROM 
            (SELECT * FROM (SELECT COUNT(*) as "likesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId"
                WHERE a.action = 'Like' AND ban."isBanned" = false
                AND a."parentId" = c.id) as "likesCount",
            (SELECT COUNT(*) as "dislikesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId" 
                WHERE a.action = 'Dislike' AND ban."isBanned" = false
                AND a."parentId" = c.id) as "dislikesCount",
            COALESCE((SELECT a."action" as "myStatus" 
                FROM actions a
                WHERE a."userId" = $1
                AND a."parentType" = 'post' 
                AND a."parentId" = c.id), 'None') as "myStatus"
                ) actions_info ) as "likesInfo" 
    FROM public.comments c
    LEFT JOIN public.users u
    ON u.id = c."userId"
    LEFT JOIN public.posts p
    ON p.id = c."postId"
    LEFT JOIN public.blogs b
    ON b.id = p."blogId"
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE c."postId" = $2 AND ban."isBanned" = false
    ORDER BY ${dynamicSort} ${sortDirection}
    OFFSET $3 ROWS FETCH NEXT $4 ROWS ONLY`,
      [userId, postId, (page - 1) * pageSize, pageSize],
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
    await this.dataSource.query(
      `
      DELETE FROM public.actions
      WHERE "userId" = $1 AND "parentId" = $2 AND "parentType" = 'comment'`,
      [userId, commentId],
    );
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

  async getBlogsWithPostsAndComments(
    page: number,
    pageSize: number,
    sortBy: string,
    sortDirection: any,
    ownerId: string,
  ) {
    const query = await this.dataSource.query(
      `
    SELECT c.*,
       (SELECT ROW_TO_JSON(actions_info) FROM 
          (SELECT * FROM 
            (SELECT COUNT(*) as "likesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId"
                WHERE a.action = 'Like' AND ban."isBanned" = false
                AND a."parentId" = c.id) as "likesCount",
            (SELECT COUNT(*) as "dislikesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId" 
                WHERE a.action = 'Dislike' AND ban."isBanned" = false
                AND a."parentId" = c.id) as "dislikesCount",
            COALESCE((SELECT a."action" as "myStatus" 
                FROM actions a
                WHERE a."userId" = $1
                AND a."parentType" = 'post' 
                AND a."parentId" = c.id), 'None') as "myStatus"
                ) actions_info ) as "likesInfo",
          (SELECT ROW_TO_JSON(comments_info) FROM 
            (SELECT * FROM 
                (SELECT * FROM))    )
    FROM public.comments c
    WHERE "blogId" = $1`,
      [ownerId],
    );
    return query[0];
  }
}
