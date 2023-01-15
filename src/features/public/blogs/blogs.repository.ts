import { Injectable } from '@nestjs/common';
import { BloggersMongo } from '../../../common/types/schemas/schemas.model';
import { Blogger, Paginator } from '../../../common/types/classes/classes';
import { BloggersDto } from './dto/bloggers.dto';
import { BanBlogDto } from '../../blogger/dto/banBlog.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BloggersEntity } from './entities/bloggers.entity';
import { BanInfoEntity } from '../../../library/entities/banInfo.entity';
import { UserBlackListEntity } from '../../../library/entities/userBlackList.entity';

@Injectable()
export class BlogsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getBloggers(
    page: number,
    pageSize: number,
    searchNameTerm: string,
    sortBy: string,
    sortDirection: any,
  ): Promise<Paginator<BloggersMongo[]>> {
    const bloggers = await this.dataSource.query(
      `
    SELECT id, name, description, "websiteUrl", "createdAt"
    FROM public.blogs b
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE b.name ILIKE $1 AND ban."isBanned" = false
    ORDER BY "${sortBy}" ${sortDirection}
    OFFSET $2 ROWS FETCH NEXT $3 ROWS ONLY`,
      ['%' + searchNameTerm + '%', (page - 1) * pageSize, pageSize],
    );

    const count = await this.dataSource.query(
      `
    SELECT COUNT(*) FROM public.blogs b
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE b.name ILIKE $1 AND ban."isBanned" = false`,
      ['%' + searchNameTerm + '%'],
    );
    const total = Math.ceil(count[0].count / pageSize);
    return {
      pagesCount: total,
      page: page,
      pageSize: pageSize,
      totalCount: +count[0].count,
      items: bloggers,
    };
  }

  async getBlogsById(id: string) {
    const query = await this.dataSource
      .createQueryBuilder()
      .select()
      .from(BloggersEntity, 'b')
      .leftJoin('banInfo', 'ban', 'ban.isBanned = false')
      .where('id = :id', { id })
      .andWhere('b.id = ban.bannedId')
      .getRawOne();
    return query;
  }

  async deleteBloggerById(id: string) {
    return this.dataSource
      .createQueryBuilder()
      .delete()
      .from(BloggersEntity)
      .where('id = :id', { id })
      .execute();
  }

  async updateBloggerById(id: string, update: BloggersDto) {
    return this.dataSource
      .createQueryBuilder()
      .update(BloggersEntity)
      .set({
        name: update.name,
        websiteUrl: update.websiteUrl,
        description: update.description,
      })
      .where('id = :id', { id });
  }

  async createBlogger(newBlogger: Blogger, userId: string) {
    const query = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(BloggersEntity)
      .values({
        id: newBlogger.id,
        name: newBlogger.name,
        websiteUrl: newBlogger.websiteUrl,
        description: newBlogger.description,
        createdAt: newBlogger.createdAt,
        userId: userId,
      })
      .returning(['id', 'name', 'websiteUrl', 'description', 'createdAt'])
      .execute();
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(BanInfoEntity)
      .values({
        bannedId: newBlogger.id,
        bannedType: 'blog',
        banReason: null,
        banDate: null,
        isBanned: false,
      })
      .execute();
    return {
      id: query.raw.id,
      name: query.raw.name,
      websiteUrl: query.raw.websiteUrl,
      description: query.raw.description,
      createdAt: query.raw.createdAt,
    };
  }

  async getBlogsWithOwnerInfo(
    page: number,
    pageSize: number,
    searchNameTerm: string,
    sortBy: string,
    sortDirection: any,
  ): Promise<Paginator<BloggersMongo[]>> {
    const query = await this.dataSource.query(
      `
    SELECT b.*, u.login, ban.* 
    FROM public.blogs b
    LEFT JOIN public.users u
    ON b."userId" = u.id
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId" 
    WHERE name ILIKE $1 AND ban."bannedType" = 'blog'
    ORDER BY "${sortBy}" ${sortDirection}
    OFFSET $2 ROWS FETCH NEXT $3 ROWS ONLY`,
      ['%' + searchNameTerm + '%', (page - 1) * pageSize, pageSize],
    );
    const count = await this.dataSource.query(
      `
    SELECT COUNT(b.*)
    FROM public.blogs b
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE name ILIKE $1 AND ban."bannedType" = 'blog'`,
      ['%' + searchNameTerm + '%'],
    );
    const total = Math.ceil(count[0].count / pageSize);

    const blogsWithUser = query.map((el) => {
      return {
        id: el.id,
        name: el.name,
        description: el.description,
        websiteUrl: el.websiteUrl,
        createdAt: el.createdAt,
        blogOwnerInfo: {
          userId: el.userId,
          userLogin: el.login,
        },
        banInfo: {
          isBanned: el.isBanned ? el.isBanned : false,
          banDate: null ? null : el.banDate,
        },
      };
    });

    return {
      pagesCount: total,
      page: page,
      pageSize: pageSize,
      totalCount: +count[0].count,
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
  ) {
    const query = await this.dataSource.query(
      `
    SELECT id, name, "websiteUrl", description, "createdAt" 
    FROM public.blogs
    WHERE "userId" = $1 AND name ILIKE $2
    ORDER BY "${sortBy}" ${sortDirection}
    OFFSET $3 ROWS FETCH NEXT $4 ROWS ONLY
    `,
      [userId, '%' + searchNameTerm + '%', (page - 1) * pageSize, pageSize],
    );

    const count = await this.dataSource.query(
      `
    SELECT COUNT(*) FROM public.blogs
    WHERE "userId" = $1 AND name ILIKE $2
    `,
      [userId, '%' + searchNameTerm + '%'],
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

  async getBannedUsers(
    page: number,
    pageSize: number,
    sortBy: string,
    sortDirection: any,
    searchLoginTerm: string,
    id: string,
  ) {
    const query = await this.dataSource.query(
      `
    SELECT ub.*, u.* FROM public."userBlackList" ub
    LEFT JOIN public.users u
    ON u.id = ub."userId"
    WHERE ub."blogId" = $1 AND u.login ILIKE $2
    ORDER BY "${sortBy}" ${sortDirection}
    OFFSET $3 ROWS FETCH NEXT $4 ROWS ONLY`,
      [id, '%' + searchLoginTerm + '%', (page - 1) * pageSize, pageSize],
    );
    const total = await this.dataSource.query(
      `
    SELECT COUNT(*) FROM public."userBlackList" ub
    LEFT JOIN public.users u
    ON u.id = ub."userId"
    WHERE ub."blogId" = $1 AND u.login ILIKE $2`,
      [id, '%' + searchLoginTerm + '%'],
    );
    const pages = Math.ceil(total[0].count / pageSize);
    const mappedUser = query.map((obj) => {
      return {
        id: obj.id,
        login: obj.login,
        banInfo: {
          banDate: obj.banDate,
          banReason: obj.banReason,
          isBanned: true,
        },
      };
    });
    return {
      pagesCount: pages,
      page: page,
      pageSize: pageSize,
      totalCount: +total[0].count,
      items: mappedUser,
    };
  }

  async banUserForBlog(banBlogDto: BanBlogDto, id: string) {
    if (banBlogDto.isBanned === true) {
      const banDate = new Date();
      return this.dataSource
        .createQueryBuilder()
        .insert()
        .into(UserBlackListEntity)
        .values({
          blogId: banBlogDto.blogId,
          userId: id,
          banReason: banBlogDto.banReason,
          banDate: banDate,
        })
        .execute();
    } else {
      return this.dataSource
        .createQueryBuilder()
        .delete()
        .from(UserBlackListEntity)
        .where('"userId" = :id ', { id })
        .execute();
    }
  }

  async getOwnerBlogId(ownerId: string, blogId: string) {
    const query = await this.dataSource.query(
      `
    SELECT * FROM public.blogs
    WHERE id = $1 AND "userId" = $2`,
      [blogId, ownerId],
    );
    return query[0];
  }

  async banBlogById(id: string, isBanned: boolean) {
    if (isBanned === true) {
      const banDate = new Date();
      return this.dataSource
        .createQueryBuilder()
        .update(BanInfoEntity)
        .set({
          isBanned: true,
          banDate: banDate,
          bannedId: id,
          bannedType: 'blog',
        })
        .execute();
    } else {
      return this.dataSource
        .createQueryBuilder()
        .update(BanInfoEntity)
        .set({
          isBanned: false,
          banDate: null,
          bannedId: id,
          bannedType: 'blog',
        })
        .execute();
    }
  }
  async getBlogForValidation(id: string) {
    const query = await this.dataSource
      .getRepository(BloggersEntity)
      .createQueryBuilder()
      .where('id = :id', { id })
      .getOne();
    return query;
  }
}
