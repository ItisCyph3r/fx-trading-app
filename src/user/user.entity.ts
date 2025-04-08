import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
  } from 'typeorm';
  import { Role } from './role.enum';
  import { Transaction } from '../transaction/transaction.entity';
  import { Wallet } from '../wallet/wallet.entity';
  
  @Entity()
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    password: string;
  
    @Column({ default: false })
    isVerified: boolean;
  
    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;
  
    @OneToMany(() => Wallet, (wallet) => wallet.user)
    wallets: Wallet[];
  
    @OneToMany(() => Transaction, (tx) => tx.user)
    transactions: Transaction[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  