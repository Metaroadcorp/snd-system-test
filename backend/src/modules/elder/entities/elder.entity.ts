import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';

export enum ElderStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

@Entity('elder')
export class Elder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 300, nullable: true })
  address: string;

  @Column({ name: 'care_grade', length: 20, nullable: true })
  careGrade: string;

  @Column({ name: 'contract_start_date', type: 'date', nullable: true })
  contractStartDate: Date;

  @Column({ name: 'contract_end_date', type: 'date', nullable: true })
  contractEndDate: Date;

  @Column({ name: 'boarding_location', length: 200, nullable: true })
  boardingLocation: string;

  @Column({ name: 'boarding_note', type: 'text', nullable: true })
  boardingNote: string;

  @Column({ name: 'health_info', type: 'jsonb', default: {} })
  healthInfo: Record<string, any>;

  @Column({ name: 'special_note', type: 'text', nullable: true })
  specialNote: string;

  @Column({ name: 'profile_image', nullable: true })
  profileImage: string;

  @Column({
    type: 'enum',
    enum: ElderStatus,
    default: ElderStatus.ACTIVE,
  })
  status: ElderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
