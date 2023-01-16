import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { CommentEntity } from '../../../public/comments/entities/comment.entity';
import { UserBlackListEntity } from '../../../../library/entities/userBlackList.entity';
import { ActionsEntity } from '../../../../library/entities/actions.entity';
import { EmailConfirmEntity } from '../../../../library/entities/emailConfirm.entity';
import { RecoveryDataEntity } from '../../../../library/entities/recoveryData.entity';
import { DeviceEntity } from '../../../public/devices/entities/device.entity';
import { BanInfoEntity } from '../../../../library/entities/banInfo.entity';
import { BloggersEntity } from '../../../public/blogs/entities/bloggers.entity';

@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id: string;
  @Column({ type: 'text', collation: 'C' })
  login: string;
  @Column('text')
  email: string;
  @Column('timestamp with time zone')
  createdAt: Date;
  @Column('text')
  passwordHash: string;
  @OneToMany(() => BloggersEntity, (blogger) => blogger.userId)
  blogger: BloggersEntity[];
  @OneToMany(() => CommentEntity, (comment) => comment.userId)
  comment: CommentEntity[];
  @OneToMany(() => ActionsEntity, (actions) => actions.userId)
  actions: ActionsEntity[];
  @OneToMany(() => EmailConfirmEntity, (emailConfirm) => emailConfirm.userId)
  emailConfirm: EmailConfirmEntity[];
  @OneToMany(() => RecoveryDataEntity, (recovery) => recovery.userId)
  recovery: RecoveryDataEntity[];
  @OneToMany(() => UserBlackListEntity, (blackList) => blackList.user)
  blackList: UserBlackListEntity[];
  @OneToMany(() => DeviceEntity, (device) => device.user)
  device: DeviceEntity[];
}
