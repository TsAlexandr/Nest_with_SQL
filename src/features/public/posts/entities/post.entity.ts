import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BloggersEntity } from '../../blogs/entities/bloggers.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';

@Entity('posts')
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
  @ManyToOne(() => BloggersEntity, (blogger) => blogger.id, {
    onDelete: 'CASCADE',
  })
  blogger: BloggersEntity;
  @OneToMany(() => CommentEntity, (comment) => comment)
  comment: CommentEntity[];
}
