export class Blogger {
  public readonly id: string;
  public readonly name: string;
  public readonly websiteUrl: string;
  public readonly description: string;
  public readonly createdAt: Date;
}

export class PostsCon {
  public readonly id: string;

  public readonly title: string;

  public readonly shortDescription: string;

  public readonly content: string;

  public readonly blogId: Blogger['id'];

  public readonly blogName: Blogger['name'];
  public readonly createdAt: Date;
}
export class BanInfoType {
  public readonly banDate: Date;
  public readonly banReason: string;
  public readonly isBanned: boolean;
}

export class User {
  public readonly id: string;
  public readonly login: string;
  public readonly email: string;
  public readonly createdAt: any;
  public readonly passwordHash: string;
  public readonly emailConfirmation: EmailConfirmType;
  public readonly recoveryData: RecoveryDataType;
  public readonly banInfo: BanInfoType;
}

export class UserAccount {
  public readonly id: string;
  public readonly email: string;
  public readonly login: string;
  public readonly passwordHash: string;
  public readonly createdAt: Date;
  public readonly unused?: string;
}

export class EmailConfirmType {
  public readonly isConfirmed: boolean;
  public readonly confirmationCode: string;
}

export class RecoveryDataType {
  public readonly recoveryCode: string;
  public readonly isConfirmed: boolean;
  public readonly expirationDate: any;
}

export type Paginator<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T;
};

export class Action {
  public readonly dislikesCount: number;
  public readonly likesCount: number;
  public readonly myStatus: string;
  public readonly newestLikes: any[];
}

export class LikesInfo {
  public readonly dislikesCount: number;
  public readonly likesCount: number;
  public readonly myStatus: string;
}

export class TotalActions {
  public readonly addedAt: Date;
  public readonly action: string;
  public readonly userId: string;
  public readonly login: string;
  public readonly isBanned: boolean;
}

export enum Actions {
  Like = 'Like',
  Dislike = 'Dislike',
  None = 'None',
}

export class BlogOwnerInfo {
  public readonly userId: string;
  public readonly userLogin: string;
}

export class BannedUserForBlog {
  public readonly id: string;
  public readonly login: string;
  public readonly isBanned: boolean;
  public readonly banReason: string;
  public readonly banDate: string;
}
