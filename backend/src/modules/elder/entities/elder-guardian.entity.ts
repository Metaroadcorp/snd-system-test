import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Elder } from './elder.entity';
import { Guardian } from './guardian.entity';

@Entity('elder_guardian')
export class ElderGuardian {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'elder_id' })
  elderId: string;

  @Column({ name: 'guardian_id' })
  guardianId: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @ManyToOne(() => Elder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'elder_id' })
  elder: Elder;

  @ManyToOne(() => Guardian, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guardian_id' })
  guardian: Guardian;
}
