import { Paginator, PostsCon } from '../../../common/types/classes/classes';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostEntity } from './entities/post.entity';
import { BloggersEntity } from '../blogs/entities/bloggers.entity';
import { ActionsEntity } from '../../../library/entities/actions.entity';

export class PostsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getPosts(
    page: number,
    pageSize: number,
    sortBy: string,
    sortDirection: any,
    userId: string,
  ): Promise<Paginator<PostsCon[]>> {
    let dynamicSort = `p."${sortBy}"`;
    if (sortBy == 'blogName') {
      dynamicSort = `name COLLATE "C"`;
    }
    const query = await this.dataSource.query(
      `
    SELECT p.*, b.name as "blogName",
        (SELECT ROW_TO_JSON(actions_info) FROM 
            (SELECT * FROM (SELECT COUNT(*) as "likesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId"
                WHERE a.action = 'Like' AND ban."isBanned" = false
                AND a."parentId" = p.id) as "likesCount",
            (SELECT COUNT(*) as "dislikesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId" 
                WHERE a.action = 'Dislike' AND ban."isBanned" = false
                AND a."parentId" = p.id) as "dislikesCount",
            COALESCE((SELECT a."action" as "myStatus" 
                FROM public.actions a
                LEFT JOIN public."banInfo" ban
                ON a."userId" = ban."bannedId"
                WHERE a."userId" = $3
                AND a."parentId" = p.id
                AND a."parentType" = 'post'
                AND ban."isBanned" = false ), 'None') as "myStatus",
        COALESCE((SELECT 
        ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(last_likes))) as "newestLikes" 
            FROM 
                (SELECT a."userId", a."addedAt", u.login 
                    FROM public.actions a
                    LEFT JOIN public.users u 
                    ON a."userId" = u.id
                    LEFT JOIN "banInfo" ban2
                    ON u.id = ban2."bannedId"
                    WHERE a.action = 'Like' 
                    AND a."parentType"='post' 
                    AND a."parentId" = p.id 
                    AND u.id = a."userId" 
                    AND ban2."isBanned" = false 
                    ORDER BY a."addedAt" DESC
                    LIMIT 3) last_likes), '[]') as "newestLikes"
                ) actions_info ) as "extendedLikesInfo"
    FROM public.posts p
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE ban."isBanned" = false
    ORDER BY ${dynamicSort} ${sortDirection}
    OFFSET $1 ROWS FETCH NEXT $2 ROWS ONLY`,
      [(page - 1) * pageSize, pageSize, userId],
    );
    const count = await this.dataSource.query(`
    SELECT COUNT(*) FROM public.posts p
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE ban."isBanned" = false`);
    const total = Math.ceil(count[0].count / pageSize);
    return {
      pagesCount: total,
      page: page,
      pageSize: pageSize,
      totalCount: +count[0].count,
      items: query,
    };
  }

  async getPostById(id: string, userId: string) {
    const query = await this.dataSource.query(
      `
    SELECT p.*, b.name as "blogName",
        (SELECT ROW_TO_JSON(actions_info) FROM 
            (SELECT * FROM (SELECT COUNT(*) as "likesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId"
                WHERE a.action = 'Like' AND ban."isBanned" = false
                AND a."parentId" = p.id) as "likesCount",
            (SELECT COUNT(*) as "dislikesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId" 
                WHERE a.action = 'Dislike' AND ban."isBanned" = false
                AND a."parentId" = p.id) as "dislikesCount",
            COALESCE((SELECT a."action" as "myStatus" 
                FROM public.actions a
                LEFT JOIN public."banInfo" ban
                ON a."userId" = ban."bannedId"
                WHERE a."userId" = $2
                AND a."parentId" = $1
                AND a."parentType" = 'post'
                AND ban."isBanned" = false), 'None') as "myStatus",
        COALESCE((SELECT 
        ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(last_likes))) as "newestLikes" 
            FROM 
                (SELECT a."userId", a."addedAt", u.login 
                    FROM public.actions a
                    LEFT JOIN public.users u 
                    ON a."userId" = u.id
                    LEFT JOIN public."banInfo" ban2
                    ON u.id = ban2."bannedId"
                    WHERE a.action = 'Like' 
                    AND a."parentType"='post' 
                    AND a."parentId" = p.id 
                    AND u.id = a."userId" 
                    AND ban2."isBanned" = false 
                    ORDER BY a."addedAt" DESC
                    LIMIT 3) last_likes), '[]') as "newestLikes"
                ) actions_info ) as "extendedLikesInfo" 
    FROM public.posts p
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    LEFT JOIN public."banInfo" ban
    ON ban."bannedId" = b.id
    WHERE p.id = $1 AND ban."isBanned" = false`,
      [id, userId],
    );
    return query[0];
  }

  async createPosts(createPost: any) {
    const query = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(PostEntity)
      .values({
        id: createPost.id,
        title: createPost.title,
        shortDescription: createPost.shortDescription,
        content: createPost.content,
        createdAt: createPost.createdAt,
        blogId: createPost.blogId,
      })
      .returning('*')
      .execute();
    const result = await this.dataSource //TODO what the f...
      .createQueryBuilder()
      .select()
      .from(PostEntity, 'p')
      .leftJoin('blogs', 'b', 'p.blogId = b.id')
      .where('p.id = :id', { id: query.raw[0].id })
      .getRawOne();
    return {
      id: createPost.id,
      title: createPost.title,
      shortDescription: createPost.shortDescription,
      content: createPost.content,
      blogId: result.blogId,
      blogName: result.name,
      createdAt: createPost.createdAt,
      extendedLikesInfo: {
        dislikesCount: 0,
        likesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
  }

  async updatePost(updPost: any) {
    return this.dataSource
      .createQueryBuilder()
      .update(PostEntity)
      .set({
        content: updPost.content,
        shortDescription: updPost.shortDescription,
        title: updPost.title,
      })
      .where('id = :id', { id: updPost.id })
      .execute();
  }

  async deletePost(id: string) {
    return this.dataSource
      .createQueryBuilder()
      .delete()
      .from(PostEntity)
      .where('id = :id', { id })
      .execute();
  }

  async updateActions(postId: string, likeStatus: string, userId: string) {
    const parentType = 'post';
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(ActionsEntity)
      .where('"userId" = :userId', { userId })
      .andWhere('"parentId" = :postId', { postId })
      .andWhere('"parentType" = :parentType', { parentType })
      .execute();
    const date = new Date();
    return this.dataSource
      .createQueryBuilder()
      .insert()
      .into(ActionsEntity)
      .values({
        userId: userId,
        action: likeStatus,
        addedAt: date,
        parentId: postId,
        parentType: 'post',
      })
      .execute();
  }

  async getPostsByBlogId(
    page: number,
    pageSize: number,
    userId: string,
    blogId: string,
    sortBy: any,
    sortDirection: string,
  ) {
    const dynamicSort = `p."${sortBy}"`;
    const query = await this.dataSource.query(
      `
    SELECT p.*, b.name as "blogName",
        (SELECT ROW_TO_JSON(actions_info) FROM 
            (SELECT * FROM (SELECT COUNT(*) as "likesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId"
                WHERE a.action = 'Like' AND ban."isBanned" = false
                AND a."parentId" = p.id) as "likesCount",
            (SELECT COUNT(*) as "dislikesCount"
                FROM public.actions a
                    LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId" 
                WHERE a.action = 'Dislike' AND ban."isBanned" = false
                AND a."parentId" = p.id) as "dislikesCount",
            COALESCE((SELECT a."action" as "myStatus" 
                FROM public.actions a
                LEFT JOIN public."banInfo" ban
                ON a."userId" = ban."bannedId"
                WHERE a."userId" = $3 
                AND a."parentId" = p.id
                AND a."parentType" = 'post'
                AND ban."isBanned" = false), 'None') as "myStatus",
        COALESCE((SELECT 
        ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(last_likes))) as "newestLikes" 
            FROM 
                (SELECT a."userId", a."addedAt", u.login 
                    FROM public.actions a
                    LEFT JOIN public.users u 
                    ON a."userId" = u.id
                    LEFT JOIN "banInfo" ban2
                    ON u.id = ban2."bannedId"
                    WHERE a.action = 'Like' 
                    AND a."parentType"='post' 
                    AND a."parentId" = p.id 
                    AND u.id = a."userId" 
                    AND ban2."isBanned" = false 
                    ORDER BY a."addedAt" DESC
                    LIMIT 3) last_likes), '[]') as "newestLikes"
                ) actions_info ) as "extendedLikesInfo"
    FROM public.posts p
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE ban."isBanned" = false AND p."blogId" = $4
    ORDER BY ${dynamicSort} ${sortDirection}
    OFFSET $1 ROWS FETCH NEXT $2 ROWS ONLY`,
      [(page - 1) * pageSize, pageSize, userId, blogId],
    );
    const count = await this.dataSource.query(
      `
    SELECT COUNT(p.*) FROM public.posts p
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE ban."isBanned" = false AND p."blogId" = $1`,
      [blogId],
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
