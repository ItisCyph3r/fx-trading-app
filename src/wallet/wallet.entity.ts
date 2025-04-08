import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    Unique,
  } from 'typeorm';
  import { User } from '../user/user.entity';
  
  @Entity()
  @Unique(['user', 'currency'])
  export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => User, (user) => user.wallets, { onDelete: 'CASCADE' })
    user: User;
  
    @Column()
    currency: string; // e.g., 'NGN', 'USD', 'EUR'
  
    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
    balance: number;
  }
  