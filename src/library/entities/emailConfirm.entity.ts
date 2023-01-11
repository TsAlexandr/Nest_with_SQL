import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';

@Entity('emailConfirm')
export class EmailConfirmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('uuid')
  userId: string;
  @Column('boolean')
  isConfirmed: boolean;
  @Column('text')
  code: string;
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  user: UserEntity;
}
