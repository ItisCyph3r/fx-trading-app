import { Injectable } from '@nestjs/common';
import { Between, ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TransactionType } from './transaction.entity';

interface GetTransactionQuery {
  type?: TransactionType;
  currency?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(Transaction)
        private readonly txRepo: Repository<Transaction>,
    ) {}

    async getUserTransactions(userId: string, query: GetTransactionQuery) {
        const {
            type,
            currency,
            from,
            to,
            page = 1,
            limit = 10,
        } = query;

        const where: any = { user: { id: userId } };

        if (type) where.type = type;
        if (currency) where.currency = ILike(currency);
        if (from && to) where.createdAt = Between(new Date(from), new Date(to));

        const [items, total] = await this.txRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
        });

        return {
        data: items,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            },
        };
    }
    async createTransaction(queryRunner: any, transactionDetails: any) {
        const transaction = this.txRepo.create(transactionDetails);
        return await queryRunner.manager.save(transaction);
      }
}
