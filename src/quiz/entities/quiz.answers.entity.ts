import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuizQuestionsEntity } from './quiz.questions.entity';

@Entity('answers')
export class QuizAnswersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('text')
  answer: string;
  @Column('uuid')
  questionId: string;
  @ManyToOne(() => QuizQuestionsEntity, (question) => question.id, {
    onDelete: 'CASCADE',
  })
  question: QuizQuestionsEntity;
}
