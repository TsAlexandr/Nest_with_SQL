import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';
import { QuizGameEntity } from './quiz-game.entity';
import { QuizQuestionsEntity } from './quiz.questions.entity';
import { QuizAnswerStatusForProgressEntity } from './quiz-correct-answers';

@Entity('playerProgress')
export class PlayerProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('uuid')
  userId: string;
  @Column('uuid')
  gameId: string;
  @Column('uuid')
  questionId: string;
  @OneToMany(() => QuizAnswerStatusForProgressEntity, (correct) => correct)
  correct: QuizAnswerStatusForProgressEntity[];
  @OneToMany(() => QuizQuestionsEntity, (question) => question)
  question: QuizQuestionsEntity[];
  @ManyToOne(() => UserEntity, (user) => user.id)
  user: UserEntity;
  @ManyToOne(() => QuizGameEntity, (game) => game.id)
  game: QuizGameEntity;
}
