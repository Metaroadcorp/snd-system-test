import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RideSchedule, RideStatus } from './ride-schedule.entity';
import { User } from '../../user/entities/user.entity';

@Entity('ride_record')
export class RideRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'schedule_id' })
  scheduleId: string;

  @Column({ type: 'enum', enum: RideStatus })
  status: RideStatus;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;

  @Column({ name: 'recorded_by', nullable: true })
  recordedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  location: { latitude: number; longitude: number };

  @Column({ type: 'text', nullable: true })
  note: string;

  @ManyToOne(() => RideSchedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schedule_id' })
  schedule: RideSchedule;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recorded_by' })
  recorder: User;
}
