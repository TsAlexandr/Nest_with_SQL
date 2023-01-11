import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../../../sa/users/entities/user.entity';

@Entity('devices')
export class DeviceEntity {
  @Column('uuid')
  userId: string;
  @PrimaryColumn('uuid')
  deviceId: string;
  @Column('text')
  ip: string;
  @Column('text')
  title: string;
  @Column('timestamp with time zone')
  lastActiveDate: Date;
  @Column('timestamp with time zone')
  expiredAt: Date;
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  user: UserEntity;
}
