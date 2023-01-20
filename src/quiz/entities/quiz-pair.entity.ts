import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PlayerProgressEntity } from './player-progress.entity';

@Entity('game')
export class QuizGameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('text')
  status: string;
  @CreateDateColumn({ type: 'timestamp with time zone', nullable: false })
  pairCreatedDate: Date;
  @Column({ type: 'timestamp with time zone', nullable: true })
  startGameDate: Date;
  @Column({ type: 'timestamp with time zone', nullable: true })
  finishGameDate: Date;
  @Column('uuid')
  player1: string;
  @Column({ type: 'uuid', nullable: true })
  player2: string;

  @OneToMany(() => PlayerProgressEntity, (progress) => progress, {
    onDelete: 'CASCADE',
  })
  progress: PlayerProgressEntity[];
}
