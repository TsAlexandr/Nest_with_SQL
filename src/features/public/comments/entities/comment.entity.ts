import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../../sa/users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { ActionsEntity } from '../../../../library/entities/actions.entity';

@Entity('comments')
export class CommentEntity {
  @PrimaryColumn('uuid')
  id: string;
  @Column('uuid')
  postId: string;
  @Column('text')
  content: string;
  @Column('uuid')
  userId: string;
  @Column('text')
  addedAt: string;
  @ManyToOne(() => PostEntity, (post) => post.comment, { onDelete: 'CASCADE' })
  post: PostEntity;
  @ManyToOne(() => UserEntity, (user) => user.comment, { onDelete: 'CASCADE' })
  user: UserEntity;
  @OneToMany(() => ActionsEntity, (actions) => actions)
  actions: ActionsEntity[];
}
