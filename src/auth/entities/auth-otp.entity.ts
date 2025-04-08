import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
  } from 'typeorm';
  
  @Entity()
  export class AuthOtp {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    email: string;
  
    @Column()
    otp: string;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  