import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum TransactionType {
    FUNDING = 'FUNDING',
    WITHDRAWAL = 'WITHDRAWAL',
    TRADE = 'TRADE',
    CONVERSION = 'CONVERSION',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: TransactionType,
    })
    type: TransactionType;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        default: TransactionStatus.PENDING,
    })
    status: TransactionStatus;

    @Column({ type: 'decimal', precision: 18, scale: 6 })
    amount: number;

    @Column()
    currency: string;

    @Column({ nullable: true })
    fromCurrency?: string;

    @Column({ nullable: true })
    toCurrency?: string;

    @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
    rate?: number;

    @Column({ nullable: true })
    note?: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.transactions)
    user: User;
}