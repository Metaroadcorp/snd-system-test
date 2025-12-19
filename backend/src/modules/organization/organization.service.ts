import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, OrganizationStatus } from './entities/organization.entity';
import { OrgType } from './entities/org-type.entity';
import { Role } from './entities/role.entity';
import { PaginationDto } from '../../common/dto';

export class CreateOrganizationDto {
  orgTypeId: string;
  parentId?: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
}

export class UpdateOrganizationDto {
  name?: string;
  address?: string;
  phone?: string;
  status?: OrganizationStatus;
  settings?: Record<string, any>;
}

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(OrgType)
    private orgTypeRepository: Repository<OrgType>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const org = this.orgRepository.create(dto);
    return this.orgRepository.save(org);
  }

  async findAll(pagination: PaginationDto) {
    const [organizations, total] = await this.orgRepository.findAndCount({
      where: { status: OrganizationStatus.ACTIVE },
      relations: ['orgType', 'parent'],
      skip: pagination.skip,
      take: pagination.limit,
      order: { createdAt: 'DESC' },
    });
    return { organizations, total };
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({
      where: { id },
      relations: ['orgType', 'parent'],
    });
    if (!org) {
      throw new NotFoundException('조직을 찾을 수 없습니다');
    }
    return org;
  }

  async findByCode(code: string): Promise<Organization | null> {
    return this.orgRepository.findOne({ where: { code } });
  }

  async findChildren(parentId: string): Promise<Organization[]> {
    return this.orgRepository.find({
      where: { parentId, status: OrganizationStatus.ACTIVE },
      relations: ['orgType'],
    });
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.findById(id);
    Object.assign(org, dto);
    return this.orgRepository.save(org);
  }

  async delete(id: string): Promise<void> {
    const org = await this.findById(id);
    org.status = OrganizationStatus.INACTIVE;
    await this.orgRepository.save(org);
  }

  // 조직 유형
  async getOrgTypes(): Promise<OrgType[]> {
    return this.orgTypeRepository.find({ order: { level: 'ASC' } });
  }

  // 역할
  async getRoles(organizationId?: string): Promise<Role[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.roleRepository.find({
      where,
      order: { level: 'DESC' },
    });
  }

  async getSystemRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { isSystem: true },
      order: { level: 'DESC' },
    });
  }

  async createRole(data: Partial<Role>): Promise<Role> {
    const role = this.roleRepository.create(data);
    return this.roleRepository.save(role);
  }
}
