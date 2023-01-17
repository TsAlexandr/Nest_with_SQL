import { Injectable } from '@nestjs/common';
import { BanUserDto } from './dto/banUser.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { BanInfoEntity } from '../../../library/entities/banInfo.entity';
import { EmailConfirmEntity } from '../../../library/entities/emailConfirm.entity';
import { RecoveryDataEntity } from '../../../library/entities/recoveryData.entity';

@Injectable()
export class UsersRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async getUsers(
    page: number,
    pageSize: number,
    searchLoginTerm: string,
    searchEmailTerm: string,
    sortBy: string,
    sortDirection: any,
    banStatus: any,
  ) {
    const users = await this.dataSource.query(
      `
    SELECT 
        u.*, b.* FROM public.users u
    LEFT JOIN public."banInfo" b
        ON u.id = b."bannedId" 
    WHERE (u.login ilike $1 OR u.email ilike $2) 
    AND 
    CASE
        WHEN '${banStatus}' = 'notBanned' 
            THEN b."isBanned" = false
        WHEN '${banStatus}' = 'banned' 
            THEN b."isBanned" = true
    ELSE b."isBanned" IN (true, false)
        END
    ORDER BY "${sortBy}" ${sortDirection}
    OFFSET $3 ROWS FETCH NEXT $4 ROWS ONLY
    `,
      [
        '%' + searchLoginTerm + '%',
        '%' + searchEmailTerm + '%',
        (page - 1) * pageSize,
        pageSize,
      ],
    );
    const total = await this.dataSource.query(
      `
    SELECT COUNT(*) FROM public.users u
    LEFT JOIN public."banInfo" b
        ON u.id = b."bannedId"
    WHERE (u.login ilike $1 OR u.email ilike $2) 
    AND 
    CASE
        WHEN '${banStatus}' = 'notBanned' 
            THEN b."isBanned" = false
        WHEN '${banStatus}' = 'banned' 
            THEN b."isBanned" = true
    ELSE b."isBanned" IN (true, false)
        END
    `,
      ['%' + searchLoginTerm + '%', '%' + searchEmailTerm + '%'],
    );
    const pages = Math.ceil(total[0].count / pageSize);

    const mappedUser = users.map((obj) => {
      return {
        id: obj.id,
        login: obj.login,
        createdAt: obj.createdAt,
        email: obj.email,
        banInfo: {
          banDate: obj.banDate,
          banReason: obj.banReason,
          isBanned: obj.isBanned,
        },
      };
    });
    return {
      pagesCount: pages,
      page: page,
      pageSize: pageSize,
      totalCount: +total[0].count,
      items: mappedUser,
    };
  }

  async createUser(newUser: any) {
    const query = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values({
        id: newUser.id,
        login: newUser.login,
        email: newUser.email,
        passwordHash: newUser.passwordHash,
        createdAt: newUser.createdAt,
      })
      .returning(['id', 'login', 'email', 'createdAt'])
      .execute();
    const ban = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(BanInfoEntity)
      .values({
        bannedId: newUser.id,
        bannedType: 'user',
        banDate: null,
        banReason: null,
        isBanned: false,
      })
      .returning(['banDate', 'banReason', 'isBanned'])
      .execute();

    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(EmailConfirmEntity)
      .values({
        userId: newUser.id,
        isConfirmed: false,
        code: newUser.confirmationCode,
      })
      .execute();

    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(RecoveryDataEntity)
      .values({
        userId: newUser.id,
        recoveryCode: newUser.recoveryCode,
        isConfirmed: false,
        expirationDate: newUser.expirationDate,
      })
      .execute();
    return { q: query.raw[0], b: ban.raw[0] };
  }

  async findByLogin(login: string) {
    const query = await this.dataSource
      .createQueryBuilder()
      .select()
      .from(UserEntity, 'u')
      .leftJoin('banInfo', 'b', 'b.isBanned = false')
      .where('u.login = :login', { login })
      .andWhere('b.bannedId = u.id')
      .getRawOne();
    return query;
  }

  async findById(id: string) {
    const query = await this.dataSource
      .createQueryBuilder()
      .select(['u.*', '"userId"'])
      .from(UserEntity, 'u')
      .leftJoin('userBlackList', 'ub', 'u.id = ub.userId')
      .where('u.id = :id', { id })
      .getRawOne();
    return query;
  }

  async delUser(id: string) {
    return this.dataSource
      .createQueryBuilder()
      .delete()
      .from(UserEntity)
      .where('id = :id', { id })
      .execute();
  }

  async findByEmail(email: string) {
    const query = await this.dataSource
      .createQueryBuilder()
      .select()
      .from(UserEntity, 'u')
      .leftJoin('emailConfirm', 'e', 'u.id = e.userId')
      .where('u.email = :email', { email })
      .getRawOne();
    return query;
  }

  async findByConfirmCode(code: string) {
    const query = await this.dataSource
      .createQueryBuilder()
      .select()
      .from(EmailConfirmEntity, 'e')
      .where('e.code = :code', { code })
      .getRawOne();
    return query;
  }

  async updateConfirm(id: string) {
    const query = await this.dataSource
      .createQueryBuilder()
      .update(EmailConfirmEntity)
      .set({ isConfirmed: true })
      .where('userId = :id', { id })
      .execute();
    return query;
  }
  async updateConfirmationCode(id: string, code: string) {
    const query = await this.dataSource
      .createQueryBuilder()
      .update(EmailConfirmEntity)
      .set({ code: code })
      .where('userId = :id', { id })
      .execute();
    return query;
  }

  async updateUserWithRecoveryData(
    id: string,
    recoveryData: {
      recoveryCode: string;
      isConfirmed: boolean;
      expirationDate: any;
    },
  ) {
    const query = await this.dataSource
      .createQueryBuilder()
      .update(RecoveryDataEntity)
      .set({
        recoveryCode: recoveryData.recoveryCode,
        isConfirmed: recoveryData.isConfirmed,
        expirationDate: recoveryData.expirationDate,
      })
      .where('userId = :id', { id })
      .returning('userId')
      .execute();
    return query.raw;
  }

  async findUserByCode(recoveryCode: string) {
    const query = await this.dataSource
      .createQueryBuilder()
      .select()
      .from(RecoveryDataEntity, 'r')
      .where('r.recoveryCode = :recoveryCode', { recoveryCode })
      .getRawOne();
    return query;
  }

  async confirmPassword(id: string, generatePassword: string) {
    return this.dataSource.query(
      `
    UPDATE public.users u, public."recoveryData" r
    SET r."isConfirmed" = true, 
        u."passwordHash" = $1
    WHERE r."userId" = $2
    AND u.id = $2, (
    SELECT * FROM public.users
    WHERE id = $2)`,
      [generatePassword, id],
    );
  }
  banUser(userId: string, banInfo: BanUserDto) {
    const userType = 'user';
    if (banInfo.isBanned == true) {
      return this.dataSource
        .createQueryBuilder()
        .update(BanInfoEntity)
        .set({
          isBanned: banInfo.isBanned,
          banReason: banInfo.banReason,
          banDate: new Date(),
        })
        .where('bannedId = :userId', { userId })
        .andWhere('bannedType like :userType', { userType: `%${userType}%` })
        .execute();
    } else {
      return this.dataSource
        .createQueryBuilder()
        .update(BanInfoEntity)
        .set({
          isBanned: banInfo.isBanned,
          banReason: null,
          banDate: null,
        })
        .where('bannedId = :userId', { userId })
        .andWhere('bannedType like :userType', { userType: `%${userType}%` })
        .execute();
    }
  }

  async deleteAll() {
    return this.dataSource.query(
      `
    DELETE FROM public."banInfo";
    DELETE FROM public.users CASCADE;
    DELETE FROM public.blogs CASCADE;
    DELETE FROM public.devices CASCADE;
    DELETE FROM public."emailConfirm";
    DELETE FROM public."recoveryData";
    DELETE FROM public.actions;
    DELETE FROM public.posts;
    DELETE FROM public.comments;
    DELETE FROM public."userBlackList";
    `,
    );
  }
}
