import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
  import { User } from 'src/user/user.entity';
  
  export enum TransactionType {
    FUNDING = 'FUNDING',
    WITHDRAWAL = 'WITHDRAWAL',
    TRADE = 'TRADE',
    CONVERSION = 'CONVERSION',
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
  
    @Column()
    amount: number;
  
    @Column()
    currency: string;
  
    @Column({ nullable: true })
    fromCurrency?: string;
  
    @Column({ nullable: true })
    toCurrency?: string;
  
    @Column({ nullable: true })
    rate?: number;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @ManyToOne(() => User, (user) => user.transactions)
    user: User;
  }
  