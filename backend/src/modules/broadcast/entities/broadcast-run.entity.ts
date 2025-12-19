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
import { BroadcastSchedule } from './broadcast-schedule.entity';
import { User } from '../../user/entities/user.entity';

export enum RunType {
  SCHEDULED = 'SCHEDULED', // 스케줄에 의한 실행
  MANUAL = 'MANUAL',       // 수동 실행 (버튼)
  EMERGENCY = 'EMERGENCY', // 긴급 방송
}

export enum RunStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('broadcast_run')
export class BroadcastRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'schedule_id', nullable: true })
  scheduleId: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'run_type', type: 'enum', enum: RunType })
  runType: RunType;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'ended_at', nullable: true })
  endedAt: Date;

  @Column({ type: 'enum', enum: RunStatus, default: RunStatus.RUNNING })
  status: RunStatus;

  @Column({ name: 'target_devices', type: 'jsonb', default: [] })
  targetDevices: { deviceId: string; status: string; error?: string }[];

  @Column({ type: 'jsonb', default: {} })
  result: {
    totalTargets?: number;
    successCount?: number;
    failCount?: number;
    errors?: string[];
  };

  @Column({ name: 'triggered_by', nullable: true })
  triggeredBy: string;

  @ManyToOne(() => BroadcastSchedule)
  @JoinColumn({ name: 'schedule_id' })
  schedule: BroadcastSchedule;

  @ManyToOne(() => BroadcastTemplate)
  @JoinColumn({ name: 'template_id' })
  template: BroadcastTemplate;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'triggered_by' })
  triggerer: User;
}
