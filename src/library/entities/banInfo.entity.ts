import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('banInfo')
export class BanInfoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('uuid')
  bannedId: string;
  @Column({ type: 'time with time zone', nullable: true })
  banDate: Date;
  @Column({ type: 'text', nullable: true })
  banReason: string;
  @Column('character varying')
  bannedType: string;
  @Column('boolean')
  isBanned: boolean;
}
