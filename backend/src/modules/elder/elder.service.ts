import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Elder, ElderStatus, Gender } from './entities/elder.entity';
import { Guardian } from './entities/guardian.entity';
import { ElderGuardian } from './entities/elder-guardian.entity';
import { PaginationDto } from '../../common/dto';

export class CreateElderDto {
  organizationId: string;
  name: string;
  birthDate?: Date;
  gender?: Gender;
  phone?: string;
  address?: string;
  careGrade?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  boardingLocation?: string;
  boardingNote?: string;
  healthInfo?: Record<string, any>;
  specialNote?: string;
}

export class UpdateElderDto {
  name?: string;
  birthDate?: Date;
  gender?: Gender;
  phone?: string;
  address?: string;
  careGrade?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  boardingLocation?: string;
  boardingNote?: string;
  healthInfo?: Record<string, any>;
  specialNote?: string;
  status?: ElderStatus;
}

export class CreateGuardianDto {
  name: string;
  phone: string;
  relationship?: string;
  address?: string;
  isEmergencyContact?: boolean;
}

@Injectable()
export class ElderService {
  constructor(
    @InjectRepository(Elder)
    private elderRepository: Repository<Elder>,
    @InjectRepository(Guardian)
    private guardianRepository: Repository<Guardian>,
    @InjectRepository(ElderGuardian)
    private elderGuardianRepository: Repository<ElderGuardian>,
  ) {}

  async create(dto: CreateElderDto): Promise<Elder> {
    const elder = this.elderRepository.create(dto);
    return this.elderRepository.save(elder);
  }

  async findAll(organizationId: string, pagination: PaginationDto) {
    const [elders, total] = await this.elderRepository.findAndCount({
      where: { organizationId, status: ElderStatus.ACTIVE },
      skip: pagination.skip,
      take: pagination.limit,
      order: { name: 'ASC' },
    });
    return { elders, total };
  }

  async findById(id: string): Promise<Elder> {
    const elder = await this.elderRepository.findOne({
      where: { id },
      relations: ['organization'],
    });
    if (!elder) {
      throw new NotFoundException('어르신을 찾을 수 없습니다');
    }
    return elder;
  }

  async update(id: string, dto: UpdateElderDto): Promise<Elder> {
    const elder = await this.findById(id);
    Object.assign(elder, dto);
    return this.elderRepository.save(elder);
  }

  async delete(id: string): Promise<void> {
    const elder = await this.findById(id);
    elder.status = ElderStatus.INACTIVE;
    await this.elderRepository.save(elder);
  }

  // 보호자 관련
  async addGuardian(
    elderId: string,
    dto: CreateGuardianDto,
    isPrimary = false,
  ): Promise<Guardian> {
    const guardian = await this.guardianRepository.save(
      this.guardianRepository.create(dto),
    );

    await this.elderGuardianRepository.save({
      elderId,
      guardianId: guardian.id,
      isPrimary,
    });

    return guardian;
  }

  async getGuardians(elderId: string): Promise<Guardian[]> {
    const relations = await this.elderGuardianRepository.find({
      where: { elderId },
      relations: ['guardian'],
    });
    return relations.map((r: ElderGuardian) => r.guardian);
  }

  async removeGuardian(elderId: string, guardianId: string): Promise<void> {
    await this.elderGuardianRepository.delete({ elderId, guardianId });
  }

  // 검색
  async search(
    organizationId: string,
    query: string,
    pagination: PaginationDto,
  ) {
    const queryBuilder = this.elderRepository
      .createQueryBuilder('elder')
      .where('elder.organization_id = :organizationId', { organizationId })
      .andWhere('elder.status = :status', { status: ElderStatus.ACTIVE })
      .andWhere('(elder.name ILIKE :query OR elder.phone ILIKE :query)', {
        query: `%${query}%`,
      })
      .skip(pagination.skip)
      .take(pagination.limit)
      .orderBy('elder.name', 'ASC');

    const [elders, total] = await queryBuilder.getManyAndCount();
    return { elders, total };
  }

  // 통계
  async getStatsByOrganization(organizationId: string) {
    const total = await this.elderRepository.count({
      where: { organizationId, status: ElderStatus.ACTIVE },
    });

    const byGender = await this.elderRepository
      .createQueryBuilder('elder')
      .select('elder.gender', 'gender')
      .addSelect('COUNT(*)', 'count')
      .where('elder.organization_id = :organizationId', { organizationId })
      .andWhere('elder.status = :status', { status: ElderStatus.ACTIVE })
      .groupBy('elder.gender')
      .getRawMany();

    const byCareGrade = await this.elderRepository
      .createQueryBuilder('elder')
      .select('elder.care_grade', 'careGrade')
      .addSelect('COUNT(*)', 'count')
      .where('elder.organization_id = :organizationId', { organizationId })
      .andWhere('elder.status = :status', { status: ElderStatus.ACTIVE })
      .groupBy('elder.care_grade')
      .getRawMany();

    return { total, byGender, byCareGrade };
  }
}
