import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from './entities/user.entity';
import { UserOrganization } from './entities/user-organization.entity';
import { UserDevice, DeviceType } from './entities/user-device.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateUserDto, UpdateUserDto, RegisterDeviceDto } from './dto/user.dto';
import { PaginationDto } from '../../common/dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserOrganization)
    private userOrgRepository: Repository<UserOrganization>,
    @InjectRepository(UserDevice)
    private userDeviceRepository: Repository<UserDevice>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      ...dto,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : undefined,
    });
    return this.userRepository.save(user);
  }

  async findAll(pagination: PaginationDto) {
    const [users, total] = await this.userRepository.findAndCount({
      where: { status: UserStatus.ACTIVE },
      skip: pagination.skip,
      take: pagination.limit,
      order: { createdAt: 'DESC' },
    });
    return { users, total };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
      delete dto.password;
    }
    
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    user.status = UserStatus.DELETED;
    await this.userRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  // 조직 관련
  async addToOrganization(
    userId: string,
    organizationId: string,
    isPrimary = false,
  ): Promise<UserOrganization> {
    const userOrg = this.userOrgRepository.create({
      userId,
      organizationId,
      isPrimary,
    });
    return this.userOrgRepository.save(userOrg);
  }

  async getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    return this.userOrgRepository.find({
      where: { userId },
      relations: ['organization'],
    });
  }

  // 디바이스 관련
  async registerDevice(
    userId: string,
    dto: RegisterDeviceDto,
  ): Promise<UserDevice> {
    // 기존 동일 토큰 비활성화
    await this.userDeviceRepository.update(
      { deviceToken: dto.deviceToken },
      { isActive: false },
    );

    const device = this.userDeviceRepository.create({
      userId,
      deviceType: dto.deviceType as DeviceType,
      deviceToken: dto.deviceToken,
      deviceInfo: dto.deviceInfo || {},
    });
    return this.userDeviceRepository.save(device);
  }

  async getActiveDevices(userId: string): Promise<UserDevice[]> {
    return this.userDeviceRepository.find({
      where: { userId, isActive: true },
    });
  }

  // 역할 관련
  async assignRole(
    userId: string,
    roleId: string,
    organizationId: string,
    assignedBy?: string,
  ): Promise<UserRole> {
    const userRole = this.userRoleRepository.create({
      userId,
      roleId,
      organizationId,
      assignedBy,
    });
    return this.userRoleRepository.save(userRole);
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.userRoleRepository.find({
      where: { userId },
      relations: ['role', 'organization'],
    });
  }

  async getUsersByOrganization(
    organizationId: string,
    pagination: PaginationDto,
  ) {
    const [userOrgs, total] = await this.userOrgRepository.findAndCount({
      where: { organizationId },
      relations: ['user'],
      skip: pagination.skip,
      take: pagination.limit,
    });
    return {
      users: userOrgs.map((uo) => uo.user),
      total,
    };
  }
}
