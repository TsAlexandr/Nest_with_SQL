import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';
import { QuizGameEntity } from './quiz-game.entity';
import { QuizAnswerStatusForProgressEntity } from './quiz-correct-answers';
import { QuizQuestionsEntity } from './quiz.questions.entity';

@Entity('playerProgress')
export class PlayerProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('uuid')
  userId: string;
  @Column('uuid')
  gameId: string;
  @OneToMany(() => QuizAnswerStatusForProgressEntity, (correct) => correct)
  correct: QuizAnswerStatusForProgressEntity[];
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  user: UserEntity;
  @ManyToOne(() => QuizGameEntity, (game) => game.id, { onDelete: 'CASCADE' })
  game: QuizGameEntity;
}
