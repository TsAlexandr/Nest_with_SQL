import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../common/types/classes/classes';
import { Model } from 'mongoose';
import {
  UserDocument,
  UserMongo,
} from '../../common/types/schemas/schemas.model';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(UserMongo.name) private usersModel: Model<UserDocument>,
  ) {}

  async getUsers(
    page: number,
    pageSize: number,
    searchLoginTerm: string,
    searchEmailTerm: string,
    sortBy: string,
    sortDirection: number,
  ) {
    const user = await this.usersModel
      .find(
        {
          $or: [
            { login: { $regex: searchLoginTerm, $options: 'i' } },
            { email: { $regex: searchEmailTerm, $options: 'i' } },
          ],
        },
        {
          passwordHash: false,
          emailConfirmation: false,
          recoveryData: false,
        },
      )
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      // @ts-ignore
      .sort({ [sortBy]: sortDirection });
    console.log(sortDirection, sortBy);
    const total = await this.usersModel.count({
      $or: [
        { login: { $regex: searchLoginTerm, $options: 'i' } },
        { email: { $regex: searchEmailTerm, $options: 'i' } },
      ],
    });
    const pages = Math.ceil(total / pageSize);

    const mappedUser = user.map((obj) => {
      return {
        id: obj.id,
        login: obj.login,
        createdAt: obj.createdAt,
        email: obj.email,
        banInfo: {
          banDate: obj.banInfo.banDate,
          banReason: obj.banInfo.banReason,
          isBanned: obj.banInfo.isBanned,
        },
      };
    });
    return {
      pagesCount: pages,
      page: page,
      pageSize: pageSize,
      totalCount: total,
      items: mappedUser,
    };
  }

  async createUser(newUser: UserMongo): Promise<UserMongo> {
    await this.usersModel.create(newUser);
    const isCreated = await this.usersModel.findOne(
      {
        id: newUser.id,
      },
      { 'banInfo._id': 0 },
    );
    return isCreated;
  }

  async findByLogin(login: string) {
    const user = await this.usersModel
      .findOne({
        login,
      })
      .lean();
    return user;
  }

  async findById(id: string) {
    const user = await this.usersModel.findOne({ id }).lean();
    return user;
  }

  async delUser(id: string) {
    const result = await this.usersModel.deleteOne({
      id,
    });
    return result.deletedCount === 1;
  }

  async findByEmail(email: string): Promise<UserMongo> {
    const user = await this.usersModel.findOne({
      email,
    });
    return user;
  }

  async findByConfirmCode(code: string) {
    const user = await this.usersModel.findOne({
      'emailConfirm.confirmationCode': code,
    });
    return user;
  }

  async updateConfirm(id: string) {
    const result = await this.usersModel.updateOne(
      { 'accountData.id': id },
      { $set: { 'emailConfirm.isConfirmed': true } },
    );
    return result.modifiedCount === 1;
  }

  async updateConfirmationCode(id: string) {
    const updatedUser = await this.usersModel.findOneAndUpdate(
      { id },
      {
        $set: {
          'emailConfirm.confirmationCode': v4(),
        },
      },
      { returnDocument: 'after' },
    );
    return updatedUser;
  }

  async addToken(id: string, token: string) {
    const updatedUser = await this.usersModel.findOneAndUpdate(
      { id },
      {
        $push: { 'accountData.unused': token.toString() },
      },
      { returnDocument: 'after' },
    );
    return updatedUser;
  }

  async updateUserWithRecoveryData(
    id: string,
    recoveryData: {
      recoveryCode: string;
      isConfirmed: boolean;
      expirationDate: any;
    },
  ) {
    await this.usersModel.updateOne(
      { id },
      { $set: { recoveryData: recoveryData } },
    );
    return this.usersModel.findOne({ id });
  }

  async findUserByCode(recoveryCode: string) {
    const user = await this.usersModel.findOne({
      'recoveryData.recoveryCode': recoveryCode,
    });
    return user;
  }

  async confirmPassword(id: string, generatePassword: string) {
    await this.usersModel.updateOne(
      { id },
      {
        $set: {
          'recoveryData.isConfirmed': true,
          passwordHash: generatePassword,
        },
      },
    );
    return this.usersModel.findOne({ id });
  }
}
