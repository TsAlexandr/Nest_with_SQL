import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuizAnswersEntity } from './quiz.answers.entity';
import { QuizGameEntity } from './quiz-game.entity';
import { PlayerProgressEntity } from './player-progress.entity';

@Entity('questions')
export class QuizQuestionsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'text', nullable: false, collation: 'C' })
  body: string;
  @Column({ type: 'boolean', default: false })
  published: boolean;
  @CreateDateColumn({ type: 'timestamp with time zone', nullable: false })
  createdAt: Date;
  @Column({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date;
  @OneToMany(() => QuizAnswersEntity, (answers) => answers, {
    onDelete: 'CASCADE',
  })
  answers: QuizAnswersEntity[];
  @ManyToOne(() => PlayerProgressEntity, (progress) => progress.id, {
    onDelete: 'CASCADE',
  })
  progress: PlayerProgressEntity;
  @ManyToMany(() => QuizGameEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable()
  questions: QuizGameEntity[];
}
