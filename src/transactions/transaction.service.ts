import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './transaction.entity';
import { GetTransactionQuery } from './dto/transactions.dto';
// import { GetTransactionQuery } from './dto/get-transaction-query.dto';

@Injectable()
export class TransactionService {
    // private readonly logger = new Logger(TransactionService.name);

    constructor(
        @InjectRepository(Transaction)
        private readonly txRepo: Repository<Transaction>,
    ) {}

    async getUserTransactions(userId: string, query: GetTransactionQuery) {
        // this.logger.debug(`Fetching transactions for user ${userId}`);
        
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

            // this.logger.debug(`Found ${total} transactions`);

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
            // this.logger.error(`Error fetching transactions: ${error.message}`);
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
            
            // this.logger.debug(`Creating transaction: ${JSON.stringify(transactionDetails)}`);
            const saved = await queryRunner.manager.save(Transaction, transaction);
            // this.logger.debug(`Transaction created with ID: ${saved.id}`);
            
            return saved;
        } catch (error) {
            // this.logger.error(`Error creating transaction: ${error.message}`);
            throw error;
        }
    }
}