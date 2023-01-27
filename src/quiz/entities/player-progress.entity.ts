import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';
import { QuizGameEntity } from './quiz-game.entity';
import { QuizAnswersEntity } from './quiz.answers.entity';
import { QuizQuestionsEntity } from './quiz.questions.entity';

@Entity('playerProgress')
export class PlayerProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'text', nullable: true })
  answerStatus: string;
  @CreateDateColumn({ type: 'timestamp with time zone' })
  addedAt: Date;
  @Column({ type: 'int', default: 0 })
  score: number;
  @Column('uuid')
  userId: string;
  @Column('uuid')
  gameId: string;
  @Column('uuid')
  questionId: string;
  @ManyToOne(() => QuizQuestionsEntity, (question) => question.id)
  question: QuizQuestionsEntity;
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  user: UserEntity;
  @ManyToOne(() => QuizGameEntity, (game) => game.id)
  game: QuizGameEntity;
}
