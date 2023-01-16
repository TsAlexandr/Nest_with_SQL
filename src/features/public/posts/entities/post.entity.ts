import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BloggersEntity } from '../../blogs/entities/bloggers.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { ActionsEntity } from '../../../../library/entities/actions.entity';

@Entity('posts')
export class PostEntity {
  @PrimaryColumn('uuid')
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
  @ManyToOne(() => BloggersEntity, (blog) => blog.id, {
    onDelete: 'CASCADE',
  })
  blog: BloggersEntity;
  @OneToMany(() => CommentEntity, (comment) => comment.post)
  comment: CommentEntity[];
  @OneToMany(() => ActionsEntity, (action) => action.post)
  action: ActionsEntity[];
}
