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
import { User } from '../../user/entities/user.entity';

export enum ContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}

export enum TargetType {
  HALL = 'HALL',       // 홀 PC 방송
  MOBILE = 'MOBILE',   // 모바일 푸시
  ALL = 'ALL',         // 둘 다
}

@Entity('broadcast_template')
export class BroadcastTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'content_type', type: 'enum', enum: ContentType })
  contentType: ContentType;

  @Column({ name: 'text_content', type: 'text', nullable: true })
  textContent: string;

  @Column({ name: 'media_url', nullable: true })
  mediaUrl: string;

  @Column({ name: 'duration_sec', default: 30 })
  durationSec: number;

  @Column({ name: 'tts_settings', type: 'jsonb', default: { speed: 1.0, voice: 'default', repeat: 1 } })
  ttsSettings: { speed: number; voice: string; repeat: number };

  @Column({ name: 'target_type', type: 'enum', enum: TargetType, default: TargetType.HALL })
  targetType: TargetType;

  @Column({ name: 'target_ids', type: 'uuid', array: true, default: [] })
  targetIds: string[];

  @Column({ name: 'is_emergency', default: false })
  isEmergency: boolean;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
