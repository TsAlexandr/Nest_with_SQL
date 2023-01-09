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
    const offset = (page - 1) * pageSize;

    if (sortBy == 'blogName') {
      sortBy = 'name';
    }
    const orderBy =
      sortBy != 'createdAt' ? `"${sortBy}" COLLATE "C"` : `b."${sortBy}"`;

    console.log(userId);
    let subQuery = ``;
    if (userId) {
      subQuery = `,
      coalesce((select  l.action as "myStatus" from actions l where l."parentType" ='post' and l."parentId" = p.id and l."userId" = '${userId}'  ),'None') as "myStatus"`;
    }
    const query = `select 
      p.*, b.name as "blogName", (select row_to_json(x2) from (select * from (select count(*) as "likesCount" from actions a left join "banInfo" ab on a."userId" = ab."bannedId" where a."parentType" ='post' and a.action = 'Like' and a."parentId" =p.id and ab."isBanned" = false ) as likesCount ,
      (select count(*) as "dislikesCount" from actions a left join "banInfo" ab on a."userId" = ab."bannedId" where a."parentType" ='post' and a.action = 'Dislike' and a."parentId" = p.id and ab."isBanned" = false ) as dislikesCount ${subQuery}) x2)as "extendedLikesInfo",
      (select ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(last_likes))) as "newestLikes" 
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
                    LIMIT 3) last_likes) as "newestLikes"
        from  posts p  join blogs b on p."blogId" = b.id order by ${orderBy} ${sortDirection} limit ${pageSize} offset ${offset}`;

    console.log(query);

    const posts = await this.dataSource.query(query);
    console.log(posts);
    const temp = posts.map((item) => {
      const t = {
        title: item.title,
        content: item.content,
        shortDescription: item.shortDescription,
        createdAt: item.createdAt,
        id: item.id,
        blogId: item.blogId,
        blogName: item.blogName,
        extendedLikesInfo: {
          likesCount: item.extendedLikesInfo.likesCount,
          dislikesCount: item.extendedLikesInfo.dislikesCount,
          myStatus: item.extendedLikesInfo.myStatus
            ? item.extendedLikesInfo.myStatus
            : 'None',
          newestLikes: item.newestLikes ? item.newestLikes : [],
        },
      };
      return t;
    });

    const totalCount = await this.dataSource.query(
      `SELECT COUNT(*) FROM public.posts p
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    LEFT JOIN public."banInfo" ban
    ON b.id = ban."bannedId"
    WHERE ban."isBanned" = false`,
    );
    console.log(totalCount);
    return {
      pagesCount: Math.ceil(+totalCount[0].count / pageSize),
      page: page,
      pageSize: pageSize,
      totalCount: +totalCount[0].count,
      items: temp,
    };
  }
  /*let dynamicSort = `p."${sortBy}"`;
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
    }; }*/

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
    const result = await this.dataSource.query(
      `
    SELECT p.*, b.name AS "blogName"
    FROM public.posts p
    LEFT JOIN public.blogs b
    ON p."blogId" = b.id
    WHERE p.id = $1`,
      [query[0].id],
    );
    result[0].extendedLikesInfo = {
      dislikesCount: 0,
      likesCount: 0,
      myStatus: 'None',
      newestLikes: [],
    };
    return result[0];
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
