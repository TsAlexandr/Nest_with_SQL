import { Model, SortOrder } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BloggersDocument,
  BloggersMongo,
  Posts,
  PostsDocument,
} from '../../../common/types/schemas/schemas.model';
import { Paginator } from '../../../common/types/classes/classes';
import { BloggersDto } from './dto/bloggers.dto';
import { BanBlogDto } from '../../blogger/dto/banBlog.dto';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectModel(BloggersMongo.name)
    private bloggersModel: Model<BloggersDocument>,
    @InjectModel(Posts.name) private postsModel: Model<PostsDocument>,
  ) {}

  async getBloggers(
    page: number,
    pageSize: number,
    searchNameTerm: string,
    sortBy: string,
    sortDirection: any,
  ): Promise<Paginator<BloggersMongo[]>> {
    const bloggers = await this.bloggersModel
      .find(
        {
          $and: [
            { name: { $regex: searchNameTerm, $options: 'i' } },
            { 'banInfo.isBanned': false },
          ],
        },
        { _id: 0, __v: 0, blogOwnerInfo: 0, blackList: 0 },
      )
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection })
      .lean();

    const count = await this.bloggersModel.countDocuments({
      $and: [
        { name: { $regex: searchNameTerm, $options: 'i' } },
        { 'banInfo.isBanned': false },
      ],
    });
    const total = Math.ceil(count / pageSize);

    return {
      pagesCount: total,
      page: page,
      pageSize: pageSize,
      totalCount: count,
      items: bloggers,
    };
  }

  async getBloggersById(id: string): Promise<BloggersMongo> {
    return this.bloggersModel.findOne({ id }, { _id: 0, __v: 0 }).lean();
  }

  async getBlogsById(id: string): Promise<BloggersMongo> {
    return this.bloggersModel
      .findOne({ id }, { _id: 0, __v: 0, blogOwnerInfo: 0, blackList: 0 })
      .lean();
  }

  async deleteBloggerById(id: string): Promise<boolean> {
    const delBlog = await this.bloggersModel.deleteOne({ id });
    return delBlog.deletedCount === 1;
  }

  async updateBloggerById(id: string, update: BloggersDto): Promise<boolean> {
    const updBlog = await this.bloggersModel.updateOne(
      { id },
      {
        $set: {
          name: update.name,
          websiteUrl: update.websiteUrl,
          description: update.description,
        },
      },
    );
    await this.postsModel.updateMany(
      { blogsId: id },
      { $set: { bloggerName: update.name } },
    );
    return updBlog.modifiedCount === 1;
  }

  async createBlogger(newBlogger: BloggersMongo): Promise<BloggersMongo> {
    await this.bloggersModel.create(newBlogger);
    return this.getBlogsById(newBlogger.id);
  }

  async bindWithUser(id: string, userId: string) {
    await this.bloggersModel.findByIdAndUpdate(
      { id },
      { $set: { 'blogOwnerInfo.userId': userId } },
    );
    return;
  }

  async getBlogsWithOwnerInfo(
    page: number,
    pageSize: number,
    searchNameTerm: string,
    sortBy: string,
    sortDirection: SortOrder,
  ): Promise<Paginator<BloggersMongo[]>> {
    const blogsWithUser = await this.bloggersModel
      .find(
        {
          name: { $regex: searchNameTerm, $options: 'i' },
        },
        { _id: 0, __v: 0, blackList: 0 },
      )
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection })
      .lean();

    const count = await this.bloggersModel.countDocuments({
      name: { $regex: searchNameTerm, $options: 'i' },
    });
    const total = Math.ceil(count / pageSize);

    return {
      pagesCount: total,
      page: page,
      pageSize: pageSize,
      totalCount: count,
      items: blogsWithUser,
    };
  }

  async getBlogsByBlogger(
    page: number,
    pageSize: number,
    searchNameTerm: string,
    sortBy: string,
    sortDirection: any,
    userId: string,
    login: string,
  ) {
    console.log(userId, login);
    const blogsByBlogger = await this.bloggersModel
      .find(
        {
          $and: [
            { name: { $regex: searchNameTerm, $options: 'i' } },
            { 'blogOwnerInfo.userId': { $regex: userId, $options: 'i' } },
            { 'blogOwnerInfo.userLogin': { $regex: login, $options: 'i' } },
          ],
        },
        { _id: 0, __v: 0, blogOwnerInfo: 0 },
      )
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection })
      .lean();

    const count = await this.bloggersModel.countDocuments({
      $and: [
        { name: { $regex: searchNameTerm, $options: 'i' } },
        { 'blogOwnerInfo.userId': { $regex: userId, $options: 'i' } },
        { 'blogOwnerInfo.userLogin': { $regex: login, $options: 'i' } },
      ],
    });
    const total = Math.ceil(count / pageSize);

    return {
      pagesCount: total,
      page: page,
      pageSize: pageSize,
      totalCount: count,
      items: blogsByBlogger,
    };
  }

  async getBannedUsers(
    page: number,
    pageSize: number,
    sortBy: string,
    sortDirection: any,
    searchLoginTerm: string,
    id: string,
    ownerId: string,
  ) {
    const newSortBy = 'blackList' + '.' + sortBy;
    const bannedUsers = await this.bloggersModel.aggregate([
      {
        $match: {
          id,
        },
      },
      { $unwind: '$blackList' },
      {
        $match: {
          'blackList.login': { $regex: searchLoginTerm, $options: 'i' },
        },
      },
      { $sort: { [newSortBy]: sortDirection } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      {
        $project: {
          _id: 0,
          id: 0,
          name: 0,
          websiteUrl: 0,
          description: 0,
          createdAt: 0,
          banInfo: 0,
          blogOwnerInfo: 0,
        },
      },
    ]);

    const count = await this.bloggersModel.aggregate([
      {
        $match: {
          id,
        },
      },
      { $unwind: '$blackList' },
      {
        $match: {
          'blackList.login': { $regex: searchLoginTerm, $options: 'i' },
        },
      },
      { $count: 'blackList' },
    ]);

    return { bannedUsers, count };
  }

  async banUserForBlog(banBlogDto: BanBlogDto, id: string, login: string) {
    if (banBlogDto.isBanned === true) {
      return this.bloggersModel.updateOne(
        { id: banBlogDto.blogId },
        {
          $push: {
            blackList: {
              id: id,
              login: login,
              isBanned: banBlogDto.isBanned,
              banDate: new Date().toISOString(),
              banReason: banBlogDto.banReason,
            },
          },
        },
      );
    } else {
      return this.bloggersModel.updateOne(
        { id: banBlogDto.blogId },
        {
          $pull: {
            blackList: { id: id },
          },
        },
      );
    }
  }

  async getOwnerBlogId(ownerId: string, blogId: string) {
    return this.bloggersModel.findOne({
      'blogOwnerInfo.userId': ownerId,
      id: blogId,
    });
  }

  async banBlogById(id: string, isBanned: boolean) {
    await this.bloggersModel.updateOne(
      { id },
      {
        $set: {
          'banInfo.isBanned': isBanned,
          'banInfo.banDate': new Date().toISOString(),
        },
      },
    );
  }

  findBannedUser(blogId: string, userId: string) {
    return this.bloggersModel.findOne({ id: blogId, 'blackList.id': userId });
  }
}
