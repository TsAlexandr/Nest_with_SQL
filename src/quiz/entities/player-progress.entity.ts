import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';
import { QuizQuestionsEntity } from './quiz.questions.entity';
import { QuizGameEntity } from './quiz-pair.entity';

@Entity('playerProgress')
export class PlayerProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('text')
  answerStatus: string;
  @Column({ type: 'timestamp with time zone', nullable: true })
  addedAt: Date;
  @Column('uuid')
  userId: string;
  @Column('uuid')
  gameId: string;
  @Column('uuid')
  questionId: string;
  @ManyToOne(() => UserEntity, (user) => user.id)
  user: UserEntity;
  @ManyToOne(() => QuizQuestionsEntity, (question) => question.id)
  question: QuizQuestionsEntity;
  @ManyToOne(() => QuizGameEntity, (game) => game.id)
  game: QuizGameEntity;
}
