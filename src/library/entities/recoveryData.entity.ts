import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';

@Entity('recoveryData')
export class RecoveryDataEntity {
  @PrimaryColumn('uuid')
  id: string;
  @Column('uuid')
  userId: string;
  @Column('text')
  recoveryCode: string;
  @Column('boolean')
  isConfirmed: boolean;
  @Column('timestamp with time zone')
  expirationDate: Date;
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  user: UserEntity;
}
