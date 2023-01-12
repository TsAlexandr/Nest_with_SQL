import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserEntity } from '../../features/sa/users/entities/user.entity';
import { BloggersEntity } from '../../features/public/blogs/entities/bloggers.entity';

@Entity('banInfo')
export class BanInfoEntity {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  id: string;
  @Column('uuid')
  userId: string;
  @Column('uuid')
  blogId: string;
  @Column({ type: 'time with time zone', nullable: true })
  banDate: Date;
  @Column({ type: 'text', nullable: true })
  banReason: string;
  @Column('boolean')
  isBanned: boolean;
  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  user: UserEntity;
  @ManyToOne(() => BloggersEntity, (blog) => blog.id, { onDelete: 'CASCADE' })
  blog: BloggersEntity;
}
