import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { PlayerProgressEntity } from './player-progress.entity';

@Entity('progressAnswerStatus')
export class QuizAnswerStatusForProgressEntity {
  @PrimaryColumn('uuid')
  progressId: string;
  @Column({ type: 'text', nullable: true })
  answerStatus: string;
  @Column({ type: 'timestamp with time zone', nullable: true })
  addedAt: Date;
  @Column({ type: 'int', default: 0 })
  score: number;
  @ManyToOne(() => PlayerProgressEntity, (progress) => progress.id)
  progress: PlayerProgressEntity;
}
