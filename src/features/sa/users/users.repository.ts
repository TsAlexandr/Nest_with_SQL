import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import {
  UserDocument,
  UserMongo,
} from '../../../common/types/schemas/schemas.model';
import { BanUserDto } from './dto/banUser.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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
  ) {
    const users = await this.dataSource.query(
      `
    SELECT u.*, b.* FROM public.users u
    LEFT JOIN public."banInfo" b
    ON u.id = b."bannedId"
    WHERE login LIKE $1 OR email LIKE $2
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
    SELECT COUNT(*) FROM public.users
    WHERE login LIKE $1 OR email LIKE $2
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

  async createUser(newUser: UserMongo) {
    const query = await this.dataSource.query(
      `
    INSERT INTO public.users (id, login, email, "createdAt", "passwordHash")
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING "id", "login", "email", "createdAt" 
    `,
      [
        newUser.id,
        newUser.login,
        newUser.email,
        newUser.createdAt,
        newUser.passwordHash,
      ],
    );
    const ban = await this.dataSource.query(
      `
      INSERT INTO public."banInfo" 
      ("bannedId", "banDate", "banReason", "bannedType", "isBanned")
      VALUES ($1, NULL, NULL, $2, false) 
      RETURNING "banDate", "banReason", "isBanned"
    `,
      [newUser.id, 'user'],
    );
    await this.dataSource.query(
      `
    INSERT INTO public."emailConfirm" 
    ("userId", "isConfirmed", code)
    VALUES ($1, false, $2)`,
      [newUser.id, newUser.emailConfirmation.confirmationCode],
    );
    await this.dataSource.query(
      `
    INSERT INTO public."recoveryData" 
    ("userId", "recoveryCode", "isConfirmed", "expirationDate")
    VALUES ($1, $2, false, $3)`,
      [
        newUser.id,
        newUser.recoveryData.recoveryCode,
        newUser.recoveryData.expirationDate,
      ],
    );

    return { q: query[0], b: ban[0] };
  }

  async findByLogin(login: string) {
    const query = await this.dataSource.query(
      `
    SELECT u.*, b.* FROM public.users u
    LEFT JOIN public."banInfo" b
    ON u.id = b."bannedId"
    WHERE login = $1`,
      [login],
    );
    return query[0];
  }

  async findById(id: string) {
    const query = await this.dataSource.query(
      `
    SELECT * FROM public.users
    WHERE id = $1`,
      [id],
    );
    return query[0];
  }

  async delUser(id: string) {
    return this.dataSource.query(
      `
    DELETE FROM public.users
    WHERE id = $1`,
      [id],
    );
  }

  async findByEmail(email: string) {
    const query = await this.dataSource.query(
      `
    SELECT u.*, b.* FROM public.users u
    LEFT JOIN public."emailConfirm" b
    ON u.id = b."userId"
    WHERE email = $1`,
      [email],
    );
    return query[0];
  }

  async findByConfirmCode(code: string) {
    const query = await this.dataSource.query(
      `
    SELECT * FROM public."emailConfirm"
    WHERE code = $1`,
      [code],
    );
    return query[0];
  }

  async updateConfirm(id: string) {
    const query = await this.dataSource.query(
      `
    UPDATE public."emailConfirm"
    SET "isConfirmed" = true
    WHERE "userId" = $1`,
      [id],
    );
    return query[0];
  }
  async updateConfirmationCode(id: string) {
    const query = await this.dataSource.query(
      `
    UPDATE public."emailConfirm"
    SET "confirmationCode" = $1
    WHERE "userId" = $2`,
      [v4(), id],
    );
    return query[0];
  }

  async updateUserWithRecoveryData(
    id: string,
    recoveryData: {
      recoveryCode: string;
      isConfirmed: boolean;
      expirationDate: any;
    },
  ) {
    const query = await this.dataSource.query(
      `
    UPDATE public."recoveryData"
    SET "recoveryCode" = $1, "isConfirmed" = $2, "expirationDate" = $3
    WHERE "userId" = $4
    RETURNING "userId"`,
      [
        recoveryData.recoveryCode,
        recoveryData.isConfirmed,
        recoveryData.expirationDate,
        id,
      ],
    );
    return query[0];
  }

  async findUserByCode(recoveryCode: string) {
    const query = await this.dataSource.query(
      `
    SELECT * FROM public."recoveryData"
    WHERE "recoveryCode" = $1`,
      [recoveryCode],
    );
    return query[0];
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
    if (banInfo.isBanned == true) {
      return this.dataSource.query(
        `
      UPDATE public."banInfo" 
      SET "isBanned" = $1, "banReason" = $2, "banDate" = $3 
      WHERE "bannedId" = $4 AND "bannedType" = $5`,
        [banInfo.isBanned, banInfo.banReason, new Date(), userId, 'user'],
      );
    } else {
      return this.dataSource.query(
        `
      UPDATE public."banInfo" 
      SET "isBanned" = $1, "banReason" = NULL, "banDate" = NULL 
      WHERE "bannedId" = $2 AND "bannedType" = $3`,
        [banInfo.isBanned, userId, 'user'],
      );
    }
  }
}
