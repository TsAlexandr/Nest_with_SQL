import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';
import { BloggersEntity } from '../../features/public/blogs/entities/bloggers.entity';

@Entity('banInfo')
export class BanInfoEntity {
  @PrimaryColumn('uuid')
  bannedId: string;
  @Column('text')
  bannedType: string;
  @Column({ type: 'timestamp with time zone', nullable: true })
  banDate: Date;
  @Column({ type: 'text', nullable: true })
  banReason: string;
  @Column({ type: 'boolean', default: false })
  isBanned: boolean;
}
