import { InjectModel } from '@nestjs/mongoose';
import {
  Comments,
  CommentsDocument,
} from '../../../common/types/schemas/schemas.model';
import { Model, SortOrder } from 'mongoose';

export class CommentsRepository {
  constructor(
    @InjectModel(Comments.name) private commentsModel: Model<CommentsDocument>,
  ) {}

  async findComment(commentId: string) {
    return this.commentsModel.findOne(
      { id: commentId },
      {
        _id: 0,
        postId: 0,
        __v: 0,
      },
    );
  }

  async findCommentForPost(commentId: string) {
    return this.commentsModel.findOne(
      { id: commentId },
      {
        _id: 0,
        postId: 0,
        __v: 0,
        totalActions: 0,
      },
    );
  }

  async getCommentWithPage(
    postId: string,
    page: number,
    pageSize: number,
    userId: string,
    sortBy: string,
    sortDirection: SortOrder,
  ) {
    const filter = { postId };
    const commentsForPosts = await this.commentsModel
      .find(filter, { _id: 0, postId: 0, __v: 0 })
      .limit(pageSize)
      .skip((page - 1) * pageSize)
      .sort({ [sortBy]: sortDirection })
      .lean();
    const total = await this.commentsModel.countDocuments(filter);
    const pages = Math.ceil(total / pageSize);

    const commentAfterDeleteField = commentsForPosts.map((obj) => {
      const currentUserStatus = obj.totalActions.find(
        (el: { userId: string }) => el.userId === userId,
      );
      const likesCount = obj.totalActions.filter(
        (el) => el.action === 'Like',
      ).length;
      const dislikesCount = obj.totalActions.filter(
        (el) => el.action === 'Dislike',
      ).length;
      return {
        createdAt: obj.createdAt,
        content: obj.content,
        id: obj.id,
        likesInfo: {
          dislikesCount: dislikesCount,
          likesCount: likesCount,
          myStatus: currentUserStatus ? currentUserStatus.action : 'None',
        },
        userId: obj.userId,
        userLogin: obj.userLogin,
      };
    });
    return {
      pagesCount: pages,
      page: page,
      pageSize: pageSize,
      totalCount: total,
      items: commentAfterDeleteField,
    };
  }

  async createComment(newComment: Comments) {
    await this.commentsModel.create(newComment);
    return this.findCommentForPost(newComment.id);
  }

  async updateComment(id: string, content: string) {
    return this.commentsModel.findOneAndUpdate(
      { id },
      { $set: { content: content } },
    );
  }

  async deleteComment(id: string) {
    const deleteComment = await this.commentsModel.deleteOne({ id });
    return deleteComment.deletedCount === 1;
  }

  async updateLikes(
    commentId: string,
    status: string,
    userId: string,
    login: string,
    createdAt: Date,
  ) {
    if (status === 'Like' || status === 'Dislike' || status === 'None') {
      await this.commentsModel.updateOne(
        { id: commentId },
        { $pull: { totalActions: { userId: userId } } },
      );
    }
    if (status === 'Like' || status === 'Dislike') {
      return this.commentsModel.updateOne(
        { id: commentId },
        {
          $push: {
            totalActions: {
              createdAt,
              action: status,
              userId: userId,
              login: login,
              isBanned: false,
            },
          },
        },
      );
    }
  }

  async updateCommentWithBanInfo(userId: string, isBanned: boolean) {
    await this.commentsModel.updateOne(
      { 'totalActions.userId': userId },
      {
        $set: { 'totalActions.$.isBanned': isBanned },
      },
    );
  }

  async getBlogsWithPostsAndComments(
    page: number,
    pageSize: number,
    sortBy: string,
    sortDirection: any,
    ownerId: string,
  ) {
    const comments = await this.commentsModel.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: 'postId',
          foreignField: 'id',
          as: 'posts',
        },
      },
      { $unwind: '$posts' },
      { $sort: { [sortBy]: sortDirection } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      {
        $project: {
          id: 1,
          content: 1,
          createdAt: 1,
          likesInfo: 1,
          commentatorInfo: {
            userId: '$userId',
            userLogin: '$userLogin',
          },
          postInfo: {
            id: '$posts.id',
            title: '$posts.title',
            blogId: '$posts.blogId',
            blogName: '$posts.blogName',
          },
        },
      },
    ]);

    const count = await this.commentsModel.countDocuments();
    return {
      pagesCount: Math.ceil(count / pageSize),
      page: page,
      pageSize: pageSize,
      totalCount: count,
      items: comments,
    };
  }
}
