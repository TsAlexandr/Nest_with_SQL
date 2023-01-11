import { Column, Entity, ManyToOne } from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';

@Entity('emailConfirm')
export class EmailConfirmEntity {
  @Column('uuid')
  userId: string;
  @Column('boolean')
  isConfirmed: boolean;
  @Column('text')
  code: string;
  @ManyToOne(() => UserEntity, (user) => user.id)
  user: UserEntity;
}
