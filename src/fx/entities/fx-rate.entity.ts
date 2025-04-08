import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class FxRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  base: string;

  @Column()
  target: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  rate: number;

  @CreateDateColumn()
  fetchedAt: Date;
}
