import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PostEntity } from '../../../public/posts/entities/post.entity';
import { CommentEntity } from '../../../public/comments/entities/comment.entity';
import { UserBlackListEntity } from '../../../../library/entities/userBlackList.entity';
import { ActionsEntity } from '../../../../library/entities/actions.entity';
import { EmailConfirmEntity } from '../../../../library/entities/emailConfirm.entity';
import { RecoveryDataEntity } from '../../../../library/entities/recoveryData.entity';
import { DeviceEntity } from '../../../public/devices/entities/device.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'text', collation: 'C' })
  login: string;
  @Column('text')
  email: string;
  @Column('timestamp with time zone')
  createdAt: Date;
  @Column('text')
  passwordHash: string;
  @OneToMany(() => CommentEntity, (comment) => comment.userId)
  comment: CommentEntity[];
  @OneToMany(() => ActionsEntity, (actions) => actions.userId)
  actions: ActionsEntity[];
  @OneToMany(() => EmailConfirmEntity, (emailConfirm) => emailConfirm.userId)
  emailConfirm: EmailConfirmEntity[];
  @OneToMany(() => RecoveryDataEntity, (recovery) => recovery.userId)
  recovery: RecoveryDataEntity[];
  @OneToMany(() => UserBlackListEntity, (blackList) => blackList)
  blackList: UserBlackListEntity[];
  @OneToMany(() => DeviceEntity, (device) => device)
  device: DeviceEntity[];
}
