import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BloggersEntity } from '../../blogs/entities/bloggers.entity';
import { UserEntity } from '../../../sa/users/entities/user.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';

@Entity()
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('text')
  title: string;
  @Column('text')
  shortDescription: string;
  @Column('text')
  content: string;
  @Column('uuid')
  blogId: string;
  @Column('timestamp with time zone')
  createdAt: Date;
  @ManyToOne(() => BloggersEntity, (blogger) => blogger.id)
  blogger: BloggersEntity;
  @ManyToOne(() => UserEntity, (user) => user.id)
  user: UserEntity;
  @OneToMany(() => CommentEntity, (comment) => comment)
  comment: CommentEntity[];
}
