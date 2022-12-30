import { Paginator, PostsCon } from '../../../common/types/classes/classes';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { authUserLogin } from '../../../../test/tests.data';

export class PostsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getPosts(
    page: number,
    pageSize: number,
    userId: string,
    blogId: string,
    searchNameTerm: string,
    sortBy: string,
    sortDirection: any,
  ): Promise<Paginator<PostsCon[]>> {
    const query = await this.dataSource.query(`
    SELECT * FROM public.posts`);
    const total = await this.dataSource.query(`
    SELECT * FROM public.posts`);
    const pages = Math.ceil(total / pageSize);

    return {
      pagesCount: pages,
      page: page,
      pageSize: pageSize,
      totalCount: total,
      items: query,
    };
  }

  async getPostById(id: string, userId: string) {
    const query = await this.dataSource.query(
      `
    SELECT p.*, b.name FROM public.posts p
    LEFT JOIN public.blogs
    ON p."blogId" = b.id
    WHERE id = $1`,
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

  /*async updateActions(
    postId: string,
    likeStatus: string,
    userId: string,
    login: string,
  ) {
    if (likeStatus === 'Like' || 'Dislike' || 'None') {
      await this.postsModel.findOneAndUpdate(
        { id: postId },
        { $pull: { totalActions: { userId: userId } } },
      );
    }
    if (likeStatus === 'Like' || 'Dislike') {
      await this.postsModel.findOneAndUpdate(
        { id: postId },
        {
          $push: {
            totalActions: {
              addedAt: new Date(),
              action: likeStatus,
              userId: userId,
              login: login,
              isBanned: false,
            },
          },
        },
      );
      return null;
    }
  }*/

  async findPostById(id: string) {
    const query = await this.dataSource.query(
      `
    SELECT p.*, b.name FROM public.posts p
    LEFT JOIN public.blogs
    ON p."blogId" = b.id
    WHERE id = $1`,
      [id],
    );
    return query[0];
  }
}
