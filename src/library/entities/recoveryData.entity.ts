import { Column, Entity, ManyToOne } from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';

@Entity('recoveryData')
export class RecoveryDataEntity {
  @Column('uuid')
  userId: string;
  @Column('text')
  recoveryCode: string;
  @Column('boolean')
  isConfirmed: boolean;
  @Column('timestamp with time zone')
  expirationDate: Date;
  @ManyToOne(() => UserEntity, (user) => user.id)
  user: UserEntity;
}
