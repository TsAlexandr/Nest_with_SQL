import { Column, Entity, ManyToOne } from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';

@Entity()
export class ActionsEntity {
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
  @ManyToOne(() => UserEntity, (user) => user.id)
  user: UserEntity;
}
