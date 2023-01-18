import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuizAnswersEntity } from './quiz.answers.entity';

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
  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: false })
  updatedAt: Date;
  @OneToMany(() => QuizAnswersEntity, (answers) => answers, {
    onDelete: 'CASCADE',
  })
  answers: QuizAnswersEntity[];
}
