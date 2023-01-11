import { Column, Entity } from 'typeorm';

@Entity('banInfo')
export class BanInfoEntity {
  @Column('uuid')
  bannedId: string;
  @Column('time with time zone')
  banDate: Date;
  @Column('text')
  banReason: string;
  @Column('character varying')
  bannedType: string;
  @Column('boolean')
  isBanned: boolean;
}
