import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('pair')
export class QuizPairEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('text')
  status: string;
  @CreateDateColumn({ type: 'timestamp with time zone', nullable: false })
  pairCreatedDate: Date;
  @CreateDateColumn({ type: 'timestamp with time zone', nullable: false })
  startGameDate: Date;
  @Column({ type: 'timestamp with time zone', nullable: true })
  finishGameDate: Date;
}
