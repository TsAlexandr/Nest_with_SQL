import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostEntity } from '../../posts/entities/post.entity';
import { UserBlackListEntity } from '../../../../library/entities/userBlackList.entity';
import { UserEntity } from '../../../sa/users/entities/user.entity';

@Entity('blogs')
export class BloggersEntity {
  @PrimaryColumn('uuid')
  id: string;
  @Column({ type: 'text', collation: 'C' })
  name: string;
  @Column('character varying')
  websiteUrl: string;
  @Column('character varying')
  description: string;
  @Column('timestamp with time zone')
  createdAt: Date;
  @Column('uuid')
  userId: string;
  @OneToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity;
  @OneToMany(() => PostEntity, (post) => post.blogger)
  post: PostEntity[];
  @OneToMany(() => UserBlackListEntity, (blackList) => blackList.blogger)
  blackList: UserBlackListEntity[];
}
