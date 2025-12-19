import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BroadcastTemplate, ContentType, TargetType } from './entities/broadcast-template.entity';
import { BroadcastSchedule, RepeatType } from './entities/broadcast-schedule.entity';
import { BroadcastRun, RunType, RunStatus } from './entities/broadcast-run.entity';
import { BroadcastFile, FileType } from './entities/broadcast-file.entity';

export class CreateTemplateDto {
  organizationId?: string;
  name: string;
  contentType: ContentType;
  textContent?: string;
  mediaUrl?: string;
  durationSec?: number;
  ttsSettings?: { speed: number; voice: string; repeat: number };
  targetType?: TargetType;
  targetIds?: string[];
  isEmergency?: boolean;
}

export class CreateScheduleDto {
  organizationId: string;
  templateId: string;
  name: string;
  repeatType?: RepeatType;
  repeatConfig?: Record<string, any>;
  scheduledTime: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class BroadcastService {
  constructor(
    @InjectRepository(BroadcastTemplate)
    private templateRepository: Repository<BroadcastTemplate>,
    @InjectRepository(BroadcastSchedule)
    private scheduleRepository: Repository<BroadcastSchedule>,
    @InjectRepository(BroadcastRun)
    private runRepository: Repository<BroadcastRun>,
    @InjectRepository(BroadcastFile)
    private fileRepository: Repository<BroadcastFile>,
  ) {}

  // 템플릿
  async createTemplate(dto: CreateTemplateDto, userId?: string): Promise<BroadcastTemplate> {
    const template = this.templateRepository.create({
      ...dto,
      createdBy: userId,
    });
    return this.templateRepository.save(template);
  }

  async getTemplates(organizationId?: string): Promise<BroadcastTemplate[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.templateRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getTemplateById(id: string): Promise<BroadcastTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['organization', 'creator'],
    });
    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다');
    }
    return template;
  }

  async updateTemplate(id: string, dto: Partial<CreateTemplateDto>): Promise<BroadcastTemplate> {
    const template = await this.getTemplateById(id);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.templateRepository.delete(id);
  }

  // 스케줄
  async createSchedule(dto: CreateScheduleDto, userId?: string): Promise<BroadcastSchedule> {
    const schedule = this.scheduleRepository.create({
      ...dto,
      createdBy: userId,
    });
    return this.scheduleRepository.save(schedule);
  }

  async getSchedules(organizationId: string): Promise<BroadcastSchedule[]> {
    return this.scheduleRepository.find({
      where: { organizationId, isActive: true },
      relations: ['template'],
      order: { scheduledTime: 'ASC' },
    });
  }

  async getScheduleById(id: string): Promise<BroadcastSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['template', 'organization'],
    });
    if (!schedule) {
      throw new NotFoundException('스케줄을 찾을 수 없습니다');
    }
    return schedule;
  }

  async updateSchedule(id: string, dto: Partial<CreateScheduleDto>): Promise<BroadcastSchedule> {
    const schedule = await this.getScheduleById(id);
    Object.assign(schedule, dto);
    return this.scheduleRepository.save(schedule);
  }

  async deleteSchedule(id: string): Promise<void> {
    const schedule = await this.getScheduleById(id);
    schedule.isActive = false;
    await this.scheduleRepository.save(schedule);
  }

  // 실행
  async runBroadcast(
    templateId: string,
    organizationId: string,
    runType: RunType,
    userId?: string,
    scheduleId?: string,
  ): Promise<BroadcastRun> {
    const run = this.runRepository.create({
      templateId,
      organizationId,
      runType,
      scheduleId,
      triggeredBy: userId,
      status: RunStatus.RUNNING,
    });
    return this.runRepository.save(run);
  }

  async completeBroadcast(
    runId: string,
    status: RunStatus,
    result: Record<string, any>,
  ): Promise<BroadcastRun> {
    const run = await this.runRepository.findOne({ where: { id: runId } });
    if (!run) {
      throw new NotFoundException('실행 기록을 찾을 수 없습니다');
    }
    run.status = status;
    run.endedAt = new Date();
    run.result = result;
    return this.runRepository.save(run);
  }

  async getRunHistory(organizationId: string, limit = 50): Promise<BroadcastRun[]> {
    return this.runRepository.find({
      where: { organizationId },
      relations: ['template', 'triggerer'],
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  // 파일 (슬라이드)
  async uploadFile(
    organizationId: string,
    fileType: FileType,
    fileUrl: string,
    fileName?: string,
    durationSec = 5,
  ): Promise<BroadcastFile> {
    const maxOrder = await this.fileRepository
      .createQueryBuilder('file')
      .select('MAX(file.display_order)', 'max')
      .where('file.organization_id = :organizationId', { organizationId })
      .getRawOne();

    const file = this.fileRepository.create({
      organizationId,
      fileType,
      fileUrl,
      fileName,
      durationSec,
      displayOrder: (maxOrder?.max || 0) + 1,
    });
    return this.fileRepository.save(file);
  }

  async getFiles(organizationId: string): Promise<BroadcastFile[]> {
    return this.fileRepository.find({
      where: { organizationId, isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async updateFileOrder(files: { id: string; displayOrder: number }[]): Promise<void> {
    for (const file of files) {
      await this.fileRepository.update(file.id, { displayOrder: file.displayOrder });
    }
  }

  async deleteFile(id: string): Promise<void> {
    await this.fileRepository.update(id, { isActive: false });
  }

  // 오늘의 스케줄 조회
  async getTodaySchedules(organizationId: string): Promise<BroadcastSchedule[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();

    const schedules = await this.scheduleRepository.find({
      where: { organizationId, isActive: true },
      relations: ['template'],
    });

    // 반복 타입에 따라 오늘 실행될 스케줄 필터링
    return schedules.filter((schedule: BroadcastSchedule) => {
      if (schedule.startDate && new Date(schedule.startDate) > today) return false;
      if (schedule.endDate && new Date(schedule.endDate) < today) return false;

      switch (schedule.repeatType) {
        case RepeatType.DAILY:
          return true;
        case RepeatType.WEEKLY:
          return schedule.repeatConfig.weekdays?.includes(dayOfWeek);
        case RepeatType.MONTHLY:
          const dayOfMonth = today.getDate();
          return schedule.repeatConfig.monthDay === dayOfMonth;
        default:
          return true;
      }
    }).sort((a: BroadcastSchedule, b: BroadcastSchedule) => a.scheduledTime.localeCompare(b.scheduledTime));
  }
}
