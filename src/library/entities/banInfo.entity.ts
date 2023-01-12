import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../../features/sa/users/entities/user.entity';
import { BloggersEntity } from '../../features/public/blogs/entities/bloggers.entity';

@Entity('banInfo')
export class BanInfoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('uuid')
  bannedId: string;
  @Column('text')
  bannedType: string;
  @Column({ type: 'time with time zone', nullable: true })
  banDate: Date;
  @Column({ type: 'text', nullable: true })
  banReason: string;
  @Column({ type: 'boolean', default: false })
  isBanned: boolean;
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  user: UserEntity;
  @ManyToOne(() => BloggersEntity, (blog) => blog.id, { onDelete: 'CASCADE' })
  blog: BloggersEntity;
}
