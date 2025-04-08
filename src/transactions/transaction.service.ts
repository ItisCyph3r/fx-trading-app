import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './transaction.entity';
import { GetTransactionQuery } from './dto/transactions.dto';
// import { GetTransactionQuery } from './dto/get-transaction-query.dto';

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

        const where: any = {};
        
        if (userId) {
            where.user = { id: userId };
        }
        
        if (type) where.type = type;
        if (currency) where.currency = ILike(currency);
        if (from && to) where.createdAt = Between(new Date(from), new Date(to));

        try {
            const [items, total] = await this.txRepo.findAndCount({
                where,
                order: { createdAt: 'DESC' },
                take: limit,
                skip: (page - 1) * limit,
                relations: ['user'],
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
        } catch (error) {
    
            throw error;
        }
    }

    async createTransaction(queryRunner: any, transactionDetails: any) {
        try {
            const transaction = this.txRepo.create({
                ...transactionDetails,
                status: TransactionStatus.SUCCESS,
                createdAt: new Date(),
            });
            
    
            const saved = await queryRunner.manager.save(Transaction, transaction);
    
            
            return saved;
        } catch (error) {
    
            throw error;
        }
    }
}