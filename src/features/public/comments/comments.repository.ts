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
    // const total = await this.commentsModel.countDocuments(filter);
    // const pages = Math.ceil(total / pageSize);
    //
    // const commentAfterDeleteField = commentsForPosts.map((obj) => {
    //   const currentUserStatus = obj.totalActions.find(
    //     (el: { userId: string }) => el.userId === userId,
    //   );
    //   const likesCount = obj.totalActions.filter(
    //     (el) => el.action === 'Like',
    //   ).length;
    //   const dislikesCount = obj.totalActions.filter(
    //     (el) => el.action === 'Dislike',
    //   ).length;
    //   return {
    //     createdAt: obj.createdAt,
    //     content: obj.content,
    //     id: obj.id,
    //     likesInfo: {
    //       dislikesCount: dislikesCount,
    //       likesCount: likesCount,
    //       myStatus: currentUserStatus ? currentUserStatus.action : 'None',
    //     },
    //     userId: obj.userId,
    //     userLogin: obj.userLogin,
    //   };
    // });
    // return {
    //   pagesCount: pages,
    //   page: page,
    //   pageSize: pageSize,
    //   totalCount: total,
    //   items: commentAfterDeleteField,
    // };
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
      return this.dataSource.query(`
      UPDATE public.actions
      SET action = $1, "addedAt" = $2
      WHERE "userId" = $1 
        AND "parentId" = $2 
          AND "parentType" = 'comment'`);
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
    //   const comments = await this.commentsModel.aggregate([
    //     {
    //       $lookup: {
    //         from: 'posts',
    //         localField: 'postId',
    //         foreignField: 'id',
    //         as: 'posts',
    //       },
    //     },
    //     { $unwind: '$posts' },
    //     { $sort: { [sortBy]: sortDirection } },
    //     { $skip: (page - 1) * pageSize },
    //     { $limit: pageSize },
    //     {
    //       $project: {
    //         _id: 0,
    //         id: 1,
    //         content: 1,
    //         createdAt: 1,
    //         likesInfo: 1,
    //         commentatorInfo: {
    //           userId: '$userId',
    //           userLogin: '$userLogin',
    //         },
    //         postInfo: {
    //           id: '$posts.id',
    //           title: '$posts.title',
    //           blogId: '$posts.blogId',
    //           blogName: '$posts.blogName',
    //         },
    //       },
    //     },
    //   ]);
    //
    //   const count = await this.commentsModel.countDocuments();
    //   return {
    //     pagesCount: Math.ceil(count / pageSize),
    //     page: page,
    //     pageSize: pageSize,
    //     totalCount: count,
    //     items: comments,
    //   };
    // }
  }
}
