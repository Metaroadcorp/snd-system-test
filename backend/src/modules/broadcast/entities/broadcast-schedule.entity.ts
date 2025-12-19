import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { BroadcastTemplate } from './broadcast-template.entity';
import { User } from '../../user/entities/user.entity';

export enum RepeatType {
  ONCE = 'ONCE',         // 1회
  DAILY = 'DAILY',       // 매일
  WEEKLY = 'WEEKLY',     // 매주 (요일 지정)
  MONTHLY = 'MONTHLY',   // 매월 (일자/요일 지정)
  QUARTERLY = 'QUARTERLY', // 분기
  YEARLY = 'YEARLY',     // 연간
}

@Entity('broadcast_schedule')
export class BroadcastSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'repeat_type', type: 'enum', enum: RepeatType, default: RepeatType.DAILY })
  repeatType: RepeatType;

  @Column({ name: 'repeat_config', type: 'jsonb', default: {} })
  repeatConfig: {
    weekdays?: number[];  // 0-6 (일-토)
    monthDay?: number;    // 1-31
    monthWeek?: number;   // 1-5 (몇째 주)
    monthWeekday?: number; // 0-6 (무슨 요일)
  };

  @Column({ name: 'scheduled_time', type: 'time' })
  scheduledTime: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => BroadcastTemplate)
  @JoinColumn({ name: 'template_id' })
  template: BroadcastTemplate;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
