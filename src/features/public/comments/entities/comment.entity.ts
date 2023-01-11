import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../../sa/users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { TotalActionsEntity } from '../../../../library/entities/actions.entity';

@Entity()
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('uuid')
  postId: string;
  @Column('text')
  content: string;
  @Column('uuid')
  userId: string;
  @Column('text')
  userLogin: string;
  @Column('text')
  addedAt: string;
  @ManyToOne(() => PostEntity, (post) => post.comment)
  post: PostEntity;
  @ManyToOne(() => UserEntity, (user) => user.comment)
  user: UserEntity;
  @OneToMany(() => TotalActionsEntity, (totalActions) => totalActions.postId)
  totalActions: TotalActionsEntity[];
}
