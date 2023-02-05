import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import {
  Action,
  BanInfoType,
  BannedUserForBlog,
  BlogOwnerInfo,
  EmailConfirmType,
  LikesInfo,
  RecoveryDataType,
  TotalActions,
  UserAccount,
} from '../../common/classes/classes';

export type BloggersDocument = BloggersMongo & Document;

@Schema({ versionKey: false })
export class BloggersMongo {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  websiteUrl: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: true })
  createdAt: string;
  @Prop({ type: BanInfoType })
  banInfo?: {
    banDate: string;
    isBanned: boolean;
  };

  @Prop({ type: BlogOwnerInfo, required: false })
  blogOwnerInfo: BlogOwnerInfo;

  @Prop({ type: BannedUserForBlog, required: false })
  blackList?: BannedUserForBlog[];
}

export const BloggerSchema = SchemaFactory.createForClass(BloggersMongo);

export type PostsDocument = Posts & Document;

@Schema({ versionKey: false })
export class Posts {
  @Prop()
  createdAt: Date;

  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  shortDescription: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String })
  blogId: string;

  @Prop({ type: String })
  blogName: string;

  @Prop({ type: Action })
  extendedLikesInfo: {
    dislikesCount: number;
    likesCount: number;
    myStatus: string;
    newestLikes: any[];
  };
  @Prop({ type: TotalActions })
  totalActions: {
    isBanned: boolean;
    addedAt: Date;
    action: string;
    userId: string;
    login: string;
  }[];
}

export const PostsSchema = SchemaFactory.createForClass(Posts);

export type CommentsDocument = Comments & Document;

@Schema({ versionKey: false })
export class Comments {
  @Prop({ type: String, required: true })
  id: string;
  @Prop({ type: String, required: true })
  postId: string;
  @Prop({ type: String, required: true })
  content: string;
  @Prop({ type: String, required: true })
  userId: string;
  @Prop({ type: String, required: true })
  userLogin: string;
  @Prop()
  createdAt: Date;
  @Prop({ type: LikesInfo })
  likesInfo: {
    dislikesCount: number;
    likesCount: number;
    myStatus: string;
  };
  @Prop({ type: TotalActions })
  totalActions: {
    createdAt: Date;
    action: string;
    userId: string;
    login: string;
    isBanned: boolean;
  }[];
}

export const CommentsSchema = SchemaFactory.createForClass(Comments);

export const InfoAboutUser = new mongoose.Schema<UserAccount>({
  id: String,
  email: String,
  login: String,
  passwordHash: String,
  createdAt: Date,
  unused: String,
});

export const EmailInfo = new mongoose.Schema<EmailConfirmType>({
  isConfirmed: Boolean,
  confirmationCode: String,
});

export const RecoveryData = new mongoose.Schema<RecoveryDataType>({
  recoveryCode: String,
  isConfirmed: Boolean,
  expirationDate: Date,
});

export const BanInfo = new mongoose.Schema<BanInfoType>({
  banDate: Date,
  banReason: String,
  isBanned: Boolean,
});

export type UserDocument = UserMongo & Document;

@Schema({ versionKey: false })
export class UserMongo {
  @Prop()
  id: string;

  @Prop()
  login: string;

  @Prop()
  email: string;

  @Prop()
  createdAt: string;

  @Prop()
  passwordHash: string;

  @Prop({ required: false })
  unused?: string;

  @Prop({ type: EmailInfo })
  emailConfirmation: EmailConfirmType;

  @Prop({ type: RecoveryData })
  recoveryData: RecoveryDataType;

  @Prop({ type: BanInfo })
  banInfo: BanInfoType;
}

export const UserSchema = SchemaFactory.createForClass(UserMongo);

export type DeviceDocument = Device & Document;

@Schema({ versionKey: false })
export class Device {
  @Prop({ type: String, required: true })
  ip: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Date, required: true, default: Date.now })
  lastActiveDate: Date;

  @Prop({ type: Date, required: true, default: Date.now })
  expiredDate: Date;

  @Prop({ type: String, required: true })
  deviceId: string;

  @Prop({ type: String, required: true })
  userId: string;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
