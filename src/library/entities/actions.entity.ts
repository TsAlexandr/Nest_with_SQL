import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';

@Entity('actions')
export class ActionsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('text')
  addedAt: string;
  @Column('uuid')
  userId: string;
  @Column('text')
  action: string;
  @Column('uuid')
  parentId: string;
  @Column('text')
  parentType: string;
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  user: UserEntity;
}
