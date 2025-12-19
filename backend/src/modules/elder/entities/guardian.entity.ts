import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('guardian')
export class Guardian {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 50, nullable: true })
  relationship: string;

  @Column({ length: 300, nullable: true })
  address: string;

  @Column({ name: 'is_emergency_contact', default: false })
  isEmergencyContact: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
