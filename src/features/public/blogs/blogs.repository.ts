import { Injectable } from '@nestjs/common';
import { BloggersMongo } from '../../../common/types/schemas/schemas.model';
import { Blogger, Paginator } from '../../../common/types/classes/classes';
import { BloggersDto } from './dto/bloggers.dto';
import { BanBlogDto } from '../../blogger/dto/banBlog.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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
    const query = await this.dataSource.query(
      `
    SELECT b.*, ban.* FROM public.blogs b
    LEFT JOIN public."banInfo" ban
    ON id = ban."bannedId"
    WHERE id = $1 AND ban."isBanned" = false`,
      [id],
    );
    return query[0];
  }

  async deleteBloggerById(id: string) {
    return this.dataSource.query(
      `
    DELETE FROM public.blogs
    WHERE id = $1`,
      [id],
    );
  }

  async updateBloggerById(id: string, update: BloggersDto) {
    return this.dataSource.query(
      `
    UPDATE public.blogs 
    SET name = $1, 
        "websiteUrl" = $2, 
        description = $3
    WHERE id = $4`,
      [update.name, update.websiteUrl, update.description, id],
    );
  }

  async createBlogger(newBlogger: Blogger, userId: string) {
    const query = await this.dataSource.query(
      `
    INSERT INTO public.blogs 
    (id, name, "websiteUrl", description, "createdAt", "userId")
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, "websiteUrl", description, "createdAt"`,
      [
        newBlogger.id,
        newBlogger.name,
        newBlogger.websiteUrl,
        newBlogger.description,
        newBlogger.createdAt,
        userId,
      ],
    );
    await this.dataSource.query(
      `
    INSERT INTO public."banInfo"
    VALUES ($1, NULL, NULL, 'blog', false)`,
      [newBlogger.id],
    );
    return query[0];
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
    console.log(query);
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
      return this.dataSource.query(
        `
      INSERT INTO public."userBlackList"
      VALUES ($1, $2, $3, $4)`,
        [banBlogDto.blogId, id, banBlogDto.banReason, banDate],
      );
    } else {
      return this.dataSource.query(
        `
      DELETE FROM public."userBlackList"
      WHERE "userId" = $1`,
        [id],
      );
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
      return this.dataSource.query(
        `
    UPDATE public."banInfo" 
    SET "isBanned" = $1, "banDate" = $2 
    WHERE "bannedId" = $3 AND "bannedType" = $4`,
        [true, banDate, id, 'blog'],
      );
    } else {
      return this.dataSource.query(
        `
    UPDATE public."banInfo" 
    SET "isBanned" = $1, "banDate" = $2 
    WHERE "bannedId" = $3 AND "bannedType" = $4`,
        [false, null, id, 'blog'],
      );
    }
  }
  async getBlogForValidation(id: string) {
    const query = await this.dataSource.query(
      `
    SELECT * FROM public.blogs
    WHERE id = $1`,
      [id],
    );
    return query[0];
  }
}
