import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';
import { PostEntity } from '../../features/public/posts/entities/post.entity';
import { CommentEntity } from '../../features/public/comments/entities/comment.entity';

@Entity('actions')
export class ActionsEntity {
  @Column('timestamp with time zone')
  addedAt: Date;
  @PrimaryColumn('uuid')
  userId: string;
  @Column('text')
  action: string;
  @Column('uuid')
  parentId: string;
  @Column('text')
  parentType: string;
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  user: UserEntity;
  @ManyToOne(() => PostEntity, (post) => post.id, { onDelete: 'CASCADE' })
  post: PostEntity;
  @ManyToOne(() => CommentEntity, (comment) => comment.id, {
    onDelete: 'CASCADE',
  })
  comment: CommentEntity;
}
