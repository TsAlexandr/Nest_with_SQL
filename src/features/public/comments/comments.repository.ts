import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { UserEntity } from '../../sa/users/entities/user.entity';
import { ActionsEntity } from '../../../library/entities/actions.entity';

export class CommentsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findComment(commentId: string, userId: string) {
    const query = await this.dataSource.query(
      `
    SELECT c.id, c.content, c."createdAt", c."userId", u.login as "userLogin", 
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
                FROM public.actions a
                LEFT JOIN public."banInfo" ban
                ON a."userId" = ban."bannedId"
                WHERE a."userId" = $2
                AND a."parentId" = $1
                AND a."parentType" = 'comment'
                AND ban."isBanned" = false), 'None') as "myStatus"
                ) actions_info ) as "likesInfo" 
    FROM public.comments c
    LEFT JOIN public.users u
    ON c."userId" = u.id
    LEFT JOIN public.posts p
    ON c."postId" = p.id
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    LEFT JOIN public."banInfo" ban
    ON c."userId" = ban."bannedId"
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
    const dynamicSort = `c."${sortBy}"`;
    const query = await this.dataSource.query(
      `
    SELECT c.id, c.content, c."createdAt", c."userId", u.login as "userLogin", 
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
                LEFT JOIN public."banInfo" ban
                ON a."userId" = ban."bannedId"
                WHERE a."userId" = $1
                AND a."parentId" = c.id
                AND a."parentType" = 'comment'
                AND ban."isBanned" = false), 'None') as "myStatus"
                ) actions_info ) as "likesInfo" 
    FROM public.comments c
    LEFT JOIN public.users u
    ON c."userId" = u.id
    LEFT JOIN public.posts p
    ON c."postId" = p.id
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE c."postId" = $2 AND ban."isBanned" = false
    ORDER BY ${dynamicSort} ${sortDirection}
    OFFSET $3 ROWS FETCH NEXT $4 ROWS ONLY`,
      [userId, postId, (page - 1) * pageSize, pageSize],
    );
    const count = await this.dataSource.query(
      `
    SELECT COUNT(*)
    FROM public.comments c
    LEFT JOIN public.users u
    ON c."userId" = u.id
    LEFT JOIN public.posts p
    ON c."postId" = p.id
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE c."postId" = $1 AND ban."isBanned" = false`,
      [postId],
    );

    const total = Math.ceil(count[0].count / pageSize);
    return {
      pagesCount: total,
      page: page,
      pageSize: pageSize,
      totalCount: +count[0].count,
      items: query,
    };
  }

  async createComment(newComment: any) {
    const query = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(CommentEntity)
      .values({
        id: newComment.id,
        content: newComment.content,
        addedAt: newComment.createdAt,
        postId: newComment.postId,
        userId: newComment.userId,
      })
      .returning('id')
      .execute();
    const result = await this.dataSource
      .createQueryBuilder()
      .select()
      .from(CommentEntity, 'c')
      .leftJoin(UserEntity, 'u', 'c.userId = u.id')
      .where('id = :id', { id: query.raw[0].id })
      .getOne();
    return {
      id: result.id,
      content: result.content,
      userId: result.userId,
      userLogin: result.user.login,
      createdAt: result.addedAt,
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
      },
    };
  }

  async updateComment(id: string, content: string) {
    return this.dataSource
      .createQueryBuilder()
      .update(CommentEntity)
      .set({
        content: content,
      })
      .where('id = :id', { id })
      .execute();
  }

  async deleteComment(id: string) {
    return this.dataSource
      .createQueryBuilder()
      .delete()
      .from(CommentEntity)
      .where('id = :id', { id });
  }

  async updateLikes(
    commentId: string,
    status: string,
    userId: string,
    createdAt: Date,
  ) {
    const parentType = 'comment';
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(ActionsEntity)
      .where('"userId" = :userId', { userId })
      .andWhere('"parentId" = :commentId', { commentId })
      .andWhere('"parentType" = :parentType', { parentType })
      .execute();
    return this.dataSource
      .createQueryBuilder()
      .insert()
      .into(ActionsEntity)
      .values({
        userId: userId,
        action: status,
        addedAt: createdAt,
        parentId: commentId,
        parentType: 'comment',
      })
      .execute();
  }

  async getBlogsWithPostsAndComments(
    page: number,
    pageSize: number,
    sortBy: string,
    sortDirection: any,
    ownerId: string,
  ) {
    const dynamicSort = `c."${sortBy}"`;
    const query = await this.dataSource.query(
      `
    SELECT c.id, c.content, c."createdAt",
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
                LEFT JOIN public."banInfo" ban
                ON a."userId" = ban."bannedId"
                WHERE a."userId" = $1
                AND a."parentId" = c.id
                AND a."parentType" = 'comment'
                AND ban."isBanned" = false), 'None') as "myStatus"
                ) actions_info ) as "likesInfo",
        (SELECT ROW_TO_JSON(comments_info) FROM 
            (SELECT * FROM 
                (SELECT u.id as "userId", u.login as "userLogin" 
                    FROM public.users u
                    WHERE u.id = c."userId") as "c_info") 
                comments_info ) as "commentatorInfo",
        (SELECT ROW_TO_JSON(posts_info) FROM 
            (SELECT * FROM 
                (SELECT 
                    p.id as id, 
                    p.title as title, 
                    p."blogId" as "blogId", 
                    b.name as "blogName" 
                        FROM public.posts p
                        LEFT JOIN public.blogs b
                        ON p."blogId" = b.id
                        WHERE p.id = c."postId") as "p_info")
                        posts_info ) as "postInfo"
    FROM public.comments c
    LEFT JOIN public.posts p
    ON c."postId" = p.id
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE b."userId" = $1 AND ban."isBanned" = false
    ORDER BY ${dynamicSort} ${sortDirection}
    OFFSET $2 ROWS FETCH NEXT $3 ROWS ONLY`,
      [ownerId, (page - 1) * pageSize, pageSize],
    );
    const count = await this.dataSource.query(
      `
    SELECT COUNT(*)
    FROM public.comments c
    LEFT JOIN public.posts p
    ON c."postId" = p.id
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE b."userId" = $1 AND ban."isBanned" = false`,
      [ownerId],
    );

    const total = Math.ceil(count[0].count / pageSize);
    return {
      pagesCount: total,
      page: page,
      pageSize: pageSize,
      totalCount: +count[0].count,
      items: query,
    };
  }
}
