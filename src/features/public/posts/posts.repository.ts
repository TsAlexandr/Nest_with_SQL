import { Paginator, PostsCon } from '../../../common/types/classes/classes';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class PostsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getPosts(
    page: number,
    pageSize: number,
    sortBy: string,
    sortDirection: any,
    userId: string,
  ): Promise<Paginator<PostsCon[]>> {
    const query = await this.dataSource.query(
      `
    SELECT p.*, b.name, u.login,
        (SELECT COUNT(*) 
            FROM public.actions a
                LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId" 
            WHERE a.action = 'Like' AND ban."isBanned" = false) as "likesCount",
        (SELECT COUNT(*)
            FROM public.actions a
                LEFT JOIN public."banInfo" ban
                    ON a."userId" = ban."bannedId" 
            WHERE a.action = 'Dislike' AND ban."isBanned" = false) as "dislikesCount"
              
    FROM public.posts p
    LEFT JOIN public.actions a
    ON p.id = a."parentId"
    LEFT JOIN public.blogs b
    ON b.id = p."blogId"
    LEFT JOIN public.users u
    ON a."userId" = u.id
    LEFT JOIN public."banInfo" ban
    ON u.id = ban."bannedId"
    WHERE ban."isBanned" = false 
    ORDER BY "${sortBy}" ${sortDirection}
    OFFSET $1 ROWS FETCH NEXT $2 ROWS ONLY`,
      [(page - 1) * pageSize, pageSize],
    );
    const total = await this.dataSource.query(`
    SELECT COUNT(*) FROM public.posts`);
    return query;
  }

  async getPostById(id: string, userId: string) {
    const query = await this.dataSource.query(
      `
    SELECT p.*, b.name FROM public.posts p
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    WHERE p.id = $1`,
      [id],
    );
    return query[0];
  }

  async createPosts(createPost: any) {
    const query = await this.dataSource.query(
      `
    INSERT INTO public.posts
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, title, "shortDescription", content, "createdAt", "blogId"`,
      [
        createPost.id,
        createPost.title,
        createPost.shortDescription,
        createPost.content,
        createPost.createdAt,
        createPost.blogId,
      ],
    );
    return {
      id: query[0].id,
      title: query[0].title,
      shortDescription: query[0].shortDescription,
      content: query[0].content,
      createdAt: query[0].createdAt,
      blogId: query[0].blogId,
      blogName: createPost.blogName,
      extendedLikesInfo: {
        dislikesCount: 0,
        likesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
  }

  async updatePost(updPost: any) {
    return this.dataSource.query(
      `
    UPDATE public.posts
    SET content = $1, "shortDescription" = $2, title = $3
    WHERE id = $4`,
      [
        updPost.content,
        updPost.shortDescription,
        updPost.title,
        updPost.postId,
      ],
    );
  }

  async deletePost(id: string) {
    return this.dataSource.query(
      `
    DELETE FROM public.posts
    WHERE id = $1`,
      [id],
    );
  }

  async updateActions(postId: string, likeStatus: string, userId: string) {
    await this.dataSource.query(
      `
    DELETE FROM public.actions
    WHERE "userId" = $1 AND "parentId" = $2 AND "parentType" = 'post'`,
      [userId, postId],
    );
    const date = new Date();
    return this.dataSource.query(
      `
    INSERT INTO public.actions
    VALUES ($1, $2, $3, $4, 'post')`,
      [userId, likeStatus, date, postId],
    );
  }

  async findPostById(id: string) {
    const query = await this.dataSource.query(
      `
    SELECT p.*, b.name, a."userId", a.action, 
       a."addedAt", u.login 
    FROM public.posts p
        LEFT JOIN public.blogs b
            ON p."blogId" = b.id
        LEFT JOIN public."banInfo" ban
            ON p."blogId" = ban."bannedId"
        LEFT JOIN public.actions a
            ON p.id = a."parentId"
        LEFT JOIN public.users u
            ON a."userId" = u.id
    WHERE p.id = $1 AND ban."isBanned" = false`,
      [id],
    );
    return query;
  }
}
