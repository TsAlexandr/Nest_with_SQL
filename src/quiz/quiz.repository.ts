import { QueryDto } from './dto/query.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class QuizRepository {
  constructor(@InjectDataSource() dataSource: DataSource) {}

  async findAll(query: QueryDto) {
    return Promise.resolve(undefined);
  }

  async create(createQuizDto: CreateQuizDto) {
    return;
  }
}
