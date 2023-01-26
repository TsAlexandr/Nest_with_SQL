import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getTestsApp } from './test.utility';
import {
  authUserLogin,
  authUserLogin2,
  authUserLogin3,
  authUserRegistration,
  authUserRegistration2,
  authUserRegistration3,
  bloggerCreate,
  createInvalidUser,
  createPostWithBloggerId,
  expectBlogger,
  expectCommentDataAfterAllLikeStatus,
  expectCommentDataWithUserDislikeStatus,
  expectCommentDataWithUserLikeStatus,
  expectPostDataAfterAllLikeStatus,
  expectPostDataWithDislikeStatus,
  expectPostDataWithUserLikeStatus,
  postWithInvalidBloggerId,
  updateTestBlogger,
  wrongBlogger,
} from './tests.data';
import { Actions } from '../src/common/types/classes/classes';
import { DataSource } from 'typeorm';

describe('App (e2e)', () => {
  jest.setTimeout(60000);
  let app: INestApplication;
  beforeAll(async () => {
    app = await getTestsApp();
  });
  afterEach(async () => {
    const dataSource = await app.resolve(DataSource);
    await dataSource.query(
      `
      CREATE OR REPLACE 
        FUNCTION truncate_tables(username IN VARCHAR) RETURNS void AS $$
          DECLARE
            statements CURSOR FOR
              SELECT tablename FROM pg_tables
                WHERE tableowner = username AND schemaname = 'public';
                  BEGIN
                   FOR stmt IN statements LOOP
      EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE;';
        END LOOP;
          END;
            $$ LANGUAGE plpgsql;
              SELECT truncate_tables('postgres');`,
    );
  }),
    afterAll(async () => {
      await app.close();
    });
  //TODO move methods for each entity into their directory,
  // because this version unreadable, doesn't work without setTimeout
  describe('Bloggers', () => {
    it('/blogs all methods', async () => {
      const createBlogger = await request(app.getHttpServer())
        .post('/blogs')
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(bloggerCreate)
        .expect(HttpStatus.CREATED);

      expect(createBlogger.body).toEqual(expectBlogger);

      const id = createBlogger.body.id;

      await request(app.getHttpServer())
        .post('/bloggers')
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(wrongBlogger)
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .get('/bloggers/' + id)
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .put('/bloggers/' + id)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(updateTestBlogger)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put('/bloggers/' + id)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(wrongBlogger)
        .expect(HttpStatus.BAD_REQUEST);

      const getBloggerAfterUpdate = await request(app.getHttpServer())
        .get('/bloggers/' + id)
        .expect(HttpStatus.OK);
      expect(getBloggerAfterUpdate.body).toEqual({
        id: id,
        name: updateTestBlogger.name,
        websiteUrl: updateTestBlogger.websiteUrl,
      });

      const getAll = await request(app.getHttpServer())
        .get('/bloggers')
        .query({ page: 1, pageSize: 10, searchNameTerm: '' })
        .expect(HttpStatus.OK);
      expect(getAll.body).toStrictEqual({
        page: 1,
        pageSize: 10,
        pagesCount: getAll.body.pagesCount,
        totalCount: getAll.body.totalCount,
        items: expect.any(Array),
      });
      await request(app.getHttpServer()).get('/bloggers').expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .post('/bloggers/' + id + '/posts')
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(createPostWithBloggerId)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .get('/bloggers/' + id + '/posts')
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .del('/bloggers/' + id)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .del('/bloggers/' + id)
        .set('Authorization', 'Basic YWRtaW46cadslcnR5')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
  describe('Posts', () => {
    it('/posts all methods', async () => {
      const createBlogger = await request(app.getHttpServer())
        .post('/bloggers')
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(bloggerCreate)
        .expect(HttpStatus.CREATED);

      expect(createBlogger.body).toEqual(expectBlogger);

      const createPostBody = {
        title: 'new title',
        shortDescription: 'new short description',
        content: 'new content for post',
        bloggerId: createBlogger.body.id,
      };

      const createPost = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(createPostBody)
        .expect(HttpStatus.CREATED);
      expect(createPost.body).toStrictEqual({
        addedAt: createPost.body.addedAt,
        id: createPost.body.id,
        title: createPost.body.title,
        shortDescription: createPost.body.shortDescription,
        content: createPost.body.content,
        bloggerId: createPost.body.bloggerId,
        bloggerName: createBlogger.body.name,
        extendedLikesInfo: {
          dislikesCount: 0,
          likesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      });

      const id = createPost.body.id;
      console.log(id);
      //create post with invalid blogger id
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(postWithInvalidBloggerId)
        .expect(HttpStatus.BAD_REQUEST);

      const getPostAfterCreate = await request(app.getHttpServer())
        .get('/posts/' + id)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .expect(HttpStatus.OK);

      const updateBody = {
        title: 'new update title',
        shortDescription: 'new update short description',
        content: 'new update content for post',
        bloggerId: createPost.body.bloggerId,
      };

      await request(app.getHttpServer())
        .put('/posts/' + id)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(updateBody)
        .expect(HttpStatus.NO_CONTENT);

      //////////////////////////USERS FOR LIKE STATUS///////////////////////////

      const firstUserForLike = await request(app.getHttpServer())
        .post('/auth/registration')
        .send(authUserRegistration)
        .expect(HttpStatus.CREATED);

      const secondUserForLike = await request(app.getHttpServer())
        .post('/auth/registration')
        .send(authUserRegistration2)
        .expect(HttpStatus.CREATED);

      const thirdUserForLike = await request(app.getHttpServer())
        .post('/auth/registration')
        .send(authUserRegistration3)
        .expect(HttpStatus.CREATED);

      const firstUserForCreateComment = await request(app.getHttpServer())
        .post('/auth/login')
        .send(authUserLogin)
        .expect(HttpStatus.OK);

      const secondUserForCreateComment = await request(app.getHttpServer())
        .post('/auth/login')
        .send(authUserLogin2)
        .expect(HttpStatus.OK);

      const thirdUserForCreateComment = await request(app.getHttpServer())
        .post('/auth/login')
        .send(authUserLogin3)
        .expect(HttpStatus.OK);

      const token1 = firstUserForCreateComment.body.accessToken;
      const token2 = secondUserForCreateComment.body.accessToken;
      const token3 = thirdUserForCreateComment.body.accessToken;

      const createCommentForPost = await request(app.getHttpServer())
        .post('/posts/' + id + '/comments')
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'new content for comment' })
        .expect(HttpStatus.CREATED);

      const firstLikeWithFirstUser = await request(app.getHttpServer())
        .put('/posts/' + id + '/like-status')
        .set('Authorization', `Bearer ${token1}`)
        .send({ likeStatus: Actions.Like })
        .expect(HttpStatus.NO_CONTENT);

      const firstDislikeWithSecondUser = await request(app.getHttpServer())
        .put('/posts/' + id + '/like-status')
        .set('Authorization', `Bearer ${token2}`)
        .send({ likeStatus: Actions.Dislike })
        .expect(HttpStatus.NO_CONTENT);

      const secondDislikeWithThirdUser = await request(app.getHttpServer())
        .put('/posts/' + id + '/like-status')
        .set('Authorization', `Bearer ${token3}`)
        .send({ likeStatus: Actions.Dislike })
        .expect(HttpStatus.NO_CONTENT);

      const thirdDislikeWithSecondUser = await request(app.getHttpServer())
        .put('/posts/' + createPost.body.id + '/like-status')
        .set('Authorization', `Bearer ${token2}`)
        .send({ likeStatus: Actions.Dislike })
        .expect(HttpStatus.NO_CONTENT);

      const firstNoneStatusWithFirstUser = await request(app.getHttpServer())
        .put('/posts/' + createPost.body.id + '/like-status')
        .set('Authorization', `Bearer ${token1}`)
        .send({ likeStatus: Actions.None })
        .expect(HttpStatus.NO_CONTENT);

      const secondLikeWithSecondUser = await request(app.getHttpServer())
        .put('/posts/' + createPost.body.id + '/like-status')
        .set('Authorization', `Bearer ${token2}`)
        .send({ likeStatus: Actions.Like })
        .expect(HttpStatus.NO_CONTENT);

      const getPostAfterAllManipulationWithUserWithoutCredencials =
        await request(app.getHttpServer())
          .get('/posts/' + createPost.body.id)
          .expect(HttpStatus.OK);
      expect(
        getPostAfterAllManipulationWithUserWithoutCredencials.body,
      ).toStrictEqual(expectPostDataAfterAllLikeStatus);

      const getPostAfterAllWithUserLikeStatus = await request(
        app.getHttpServer(),
      )
        .get('/posts/' + createPost.body.id)
        .set('Authorization', `Bearer ${token2}`)
        .expect(HttpStatus.OK);
      expect(getPostAfterAllWithUserLikeStatus.body).toStrictEqual(
        expectPostDataWithUserLikeStatus,
      );

      const getPostAfterAllWithDislikeStatus = await request(
        app.getHttpServer(),
      )
        .get('/posts/' + createPost.body.id)
        .set('Authorization', `Bearer ${token3}`)
        .expect(HttpStatus.OK);
      expect(getPostAfterAllWithDislikeStatus.body).toStrictEqual(
        expectPostDataWithDislikeStatus,
      );

      await request(app.getHttpServer())
        .get('/posts/' + createCommentForPost.body.postId + '/comments')
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .del('/posts/' + id)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .expect(HttpStatus.NO_CONTENT);
    });
  });
  describe('Authorization', () => {
    it('/auth all methods', async () => {
      const userCreated = await request(app.getHttpServer())
        .post('/auth/registration')
        .send(authUserRegistration)
        .expect(HttpStatus.CREATED);

      const loginUser = await request(app.getHttpServer())
        .post('/auth/login')
        .send(authUserLogin)
        .expect(HttpStatus.OK);
      //TODO how extract cookie
      // const token = loginUser.body.accessToken;
      //
      // const refreshTokenByUser = await request(app.getHttpServer())
      //   .post('/auth/refresh-token')
      //   .set('Cookie', `${cookie}`)
      //   .expect(HttpStatus.CREATED);
    });
  });
  describe('Users', () => {
    it('/users all methods', async () => {
      const createUser = await request(app.getHttpServer())
        .post('/users')
        .send(authUserRegistration)
        .expect(HttpStatus.CREATED);

      const createUserWithInvalidValues = await request(app.getHttpServer())
        .post('/users')
        .send(createInvalidUser)
        .expect(HttpStatus.BAD_REQUEST);

      const getUsersWithoutPage = await request(app.getHttpServer())
        .get('/users')
        .expect(HttpStatus.OK);

      const getUsersWithPage = await request(app.getHttpServer())
        .get('/users')
        .query({ page: 2, pageSize: 3, searchNameTerm: '' })
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .del('/users/' + createUser.body.id)
        .expect(HttpStatus.NO_CONTENT);
    });
  });
  describe('Comments', () => {
    it('/comments all methods', async () => {
      const createBlogger = await request(app.getHttpServer())
        .post('/bloggers')
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(bloggerCreate)
        .expect(HttpStatus.CREATED);

      const createPostBody = {
        title: 'new title',
        shortDescription: 'new short description',
        content: 'new content for post',
        bloggerId: createBlogger.body.id,
      };

      const createPost = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .send(createPostBody)
        .expect(HttpStatus.CREATED);

      const createUserForCreateComment = await request(app.getHttpServer())
        .post('/auth/registration')
        .send(authUserRegistration)
        .expect(HttpStatus.CREATED);

      const userForCreateComment = await request(app.getHttpServer())
        .post('/auth/login')
        .send(authUserLogin)
        .expect(HttpStatus.OK);

      const id = createPost.body.id;
      const token = userForCreateComment.body.accessToken;

      const createCommentForPost = await request(app.getHttpServer())
        .post('/posts/' + id + '/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'new content for comment' })
        .expect(HttpStatus.CREATED);

      const commentId = createCommentForPost.body.id;

      //////////////////////////USERS FOR LIKE STATUS///////////////////////////

      const firstUserForLike = await request(app.getHttpServer())
        .post('/auth/registration')
        .send(authUserRegistration)
        .expect(HttpStatus.CREATED);

      const secondUserForLike = await request(app.getHttpServer())
        .post('/auth/registration')
        .send(authUserRegistration2)
        .expect(HttpStatus.CREATED);

      const thirdUserForLike = await request(app.getHttpServer())
        .post('/auth/registration')
        .send(authUserRegistration3)
        .expect(HttpStatus.CREATED);

      const firstUserForCreateComment = await request(app.getHttpServer())
        .post('/auth/login')
        .send(authUserLogin)
        .expect(HttpStatus.OK);

      const secondUserForCreateComment = await request(app.getHttpServer())
        .post('/auth/login')
        .send(authUserLogin2)
        .expect(HttpStatus.OK);

      const thirdUserForCreateComment = await request(app.getHttpServer())
        .post('/auth/login')
        .send(authUserLogin3)
        .expect(HttpStatus.OK);

      const token1 = firstUserForCreateComment.body.accessToken;
      const token2 = secondUserForCreateComment.body.accessToken;
      const token3 = thirdUserForCreateComment.body.accessToken;

      const firstLikeWithFirstUser = await request(app.getHttpServer())
        .put('/comments/' + commentId + '/like-status')
        .set('Authorization', `Bearer ${token1}`)
        .send({ likeStatus: Actions.Like })
        .expect(HttpStatus.NO_CONTENT);

      const firstDislikeWithSecondUser = await request(app.getHttpServer())
        .put('/comments/' + commentId + '/like-status')
        .set('Authorization', `Bearer ${token2}`)
        .send({ likeStatus: Actions.Dislike })
        .expect(HttpStatus.NO_CONTENT);

      const secondDislikeWithThirdUser = await request(app.getHttpServer())
        .put('/comments/' + commentId + '/like-status')
        .set('Authorization', `Bearer ${token3}`)
        .send({ likeStatus: Actions.Dislike })
        .expect(HttpStatus.NO_CONTENT);

      const thirdDislikeWithSecondUser = await request(app.getHttpServer())
        .put('/comments/' + commentId + '/like-status')
        .set('Authorization', `Bearer ${token2}`)
        .send({ likeStatus: Actions.Dislike })
        .expect(HttpStatus.NO_CONTENT);

      const firstNoneStatusWithFirstUser = await request(app.getHttpServer())
        .put('/comments/' + commentId + '/like-status')
        .set('Authorization', `Bearer ${token1}`)
        .send({ likeStatus: Actions.None })
        .expect(HttpStatus.NO_CONTENT);

      const secondLikeWithSecondUser = await request(app.getHttpServer())
        .put('/comments/' + commentId + '/like-status')
        .set('Authorization', `Bearer ${token2}`)
        .send({ likeStatus: Actions.Like })
        .expect(HttpStatus.NO_CONTENT);

      const getCommentAfterAllManipulationWithUserWithoutCredential =
        await request(app.getHttpServer())
          .get('/comments/' + commentId)
          .expect(HttpStatus.OK);
      expect(
        getCommentAfterAllManipulationWithUserWithoutCredential.body,
      ).toStrictEqual(expectCommentDataAfterAllLikeStatus);

      const getCommentAfterAllWithUserLikeStatus = await request(
        app.getHttpServer(),
      )
        .get('/comments/' + commentId)
        .set('Authorization', `Bearer ${token2}`)
        .expect(HttpStatus.OK);
      expect(getCommentAfterAllWithUserLikeStatus.body).toStrictEqual(
        expectCommentDataWithUserLikeStatus,
      );

      const getPostAfterAllWithDislikeStatus = await request(
        app.getHttpServer(),
      )
        .get('/comments/' + commentId)
        .set('Authorization', `Bearer ${token3}`)
        .expect(HttpStatus.OK);
      expect(getPostAfterAllWithDislikeStatus.body).toStrictEqual(
        expectCommentDataWithUserDislikeStatus,
      );

      await request(app.getHttpServer())
        .get('/comments/' + commentId)
        .expect(HttpStatus.OK);

      // await request(app.getHttpServer())
      //   .del('/comments/' + commentId)
      //   .set('Authorization', `Bearer ${userForCreateComment.body.accessToken}`)
      //   .expect(HttpStatus.NO_CONTENT);
    });
  });
});
