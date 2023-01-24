import { PlayerProgressEntity } from '../../quiz/entities/player-progress.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

export const postMapper = (id, post) => {
  const currentUserStatus = post.find((el) => el.userId === id);
  const likesCount = post.filter((el) => el.action === 'Like').length;
  const dislikesCount = post.filter((el) => el.action === 'Dislike').length;
  return {
    id: post[0].id,
    title: post[0].title,
    shortDescription: post[0].shortDescription,
    content: post[0].content,
    createdAt: post[0].createdAt,
    blogId: post[0].blogId,
    blogName: post[0].name,
    extendedLikesInfo: {
      likesCount: likesCount,
      dislikesCount: dislikesCount,
      myStatus: currentUserStatus ? currentUserStatus.action : 'None',
      newestLikes: post
        .filter((el) => el.action === 'Like')
        .reverse()
        .slice(0, 3)
        .map((el) => {
          delete el.action;
          return el;
        }),
    },
  };
};

export const mappedQuestions = (value) => {
  const array = value.forEach((el) => {
    delete el.body;
  });
  return array;
};

@Injectable()
export class HelperForProgress {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async saveProgress(questions: any, userId: string) {
    const mappedQuestion = mappedQuestions(questions);
    const playerProgress = new PlayerProgressEntity();
    playerProgress.userId = userId;
    playerProgress.questionId = mappedQuestion;
    await this.dataSource.manager.save(mappedQuestion);
  }
}
