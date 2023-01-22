import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuizAnswersEntity } from './quiz.answers.entity';
import { PlayerProgressEntity } from './player-progress.entity';
import { QuizGameEntity } from './quiz-pair.entity';

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
  @OneToMany(() => PlayerProgressEntity, (progress) => progress, {
    onDelete: 'CASCADE',
  })
  progress: PlayerProgressEntity[];
  @ManyToMany(() => QuizQuestionsEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable()
  questions: QuizQuestionsEntity[];
}
