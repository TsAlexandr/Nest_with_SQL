import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BloggersEntity } from '../../features/public/blogs/entities/bloggers.entity';
import { UserEntity } from '../../features/sa/users/entities/user.entity';

@Entity('userBlackList')
export class UserBlackListEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('uuid')
  blogId: string;
  @Column('uuid')
  userId: string;
  @Column('text')
  banReason: string;
  @Column('timestamp with time zone')
  banDate: Date;
  @ManyToOne(() => BloggersEntity, (blogger) => blogger.id, {
    onDelete: 'CASCADE',
  })
  blogger: BloggersEntity;
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  user: UserEntity;
}
