import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RideSchedule, RideStatus, RouteType } from './entities/ride-schedule.entity';
import { RideRecord } from './entities/ride-record.entity';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';
import { PaginationDto } from '../../common/dto';

export class CreateRideScheduleDto {
  organizationId: string;
  serviceDate: Date;
  elderId: string;
  routeType: RouteType;
  scheduledTime: string;
  vehicleId?: string;
  driverId?: string;
  managerIds?: string[];
  sequence?: number;
}

export class UpdateRideScheduleDto {
  scheduledTime?: string;
  vehicleId?: string;
  driverId?: string;
  managerIds?: string[];
  sequence?: number;
  status?: RideStatus;
}

export class CreateVehicleDto {
  organizationId: string;
  name: string;
  plateNumber: string;
  capacity?: number;
  vehicleType?: string;
}

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(RideSchedule)
    private rideScheduleRepository: Repository<RideSchedule>,
    @InjectRepository(RideRecord)
    private rideRecordRepository: Repository<RideRecord>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  // 송영 스케줄
  async createSchedule(dto: CreateRideScheduleDto): Promise<RideSchedule> {
    const schedule = this.rideScheduleRepository.create(dto);
    return this.rideScheduleRepository.save(schedule);
  }

  async createBulkSchedules(dtos: CreateRideScheduleDto[]): Promise<RideSchedule[]> {
    const schedules = this.rideScheduleRepository.create(dtos);
    return this.rideScheduleRepository.save(schedules);
  }

  async getSchedulesByDate(
    organizationId: string,
    date: Date,
    routeType?: RouteType,
  ): Promise<RideSchedule[]> {
    const where: any = {
      organizationId,
      serviceDate: date,
    };
    if (routeType) {
      where.routeType = routeType;
    }

    return this.rideScheduleRepository.find({
      where,
      relations: ['elder', 'vehicle', 'driver'],
      order: { scheduledTime: 'ASC', sequence: 'ASC' },
    });
  }

  async getSchedulesByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RideSchedule[]> {
    return this.rideScheduleRepository.find({
      where: {
        organizationId,
        serviceDate: Between(startDate, endDate),
      },
      relations: ['elder', 'vehicle', 'driver'],
      order: { serviceDate: 'ASC', scheduledTime: 'ASC' },
    });
  }

  async getScheduleById(id: string): Promise<RideSchedule> {
    const schedule = await this.rideScheduleRepository.findOne({
      where: { id },
      relations: ['elder', 'vehicle', 'driver', 'organization'],
    });
    if (!schedule) {
      throw new NotFoundException('송영 스케줄을 찾을 수 없습니다');
    }
    return schedule;
  }

  async updateSchedule(id: string, dto: UpdateRideScheduleDto): Promise<RideSchedule> {
    const schedule = await this.getScheduleById(id);
    Object.assign(schedule, dto);
    return this.rideScheduleRepository.save(schedule);
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.rideScheduleRepository.delete(id);
  }

  // 상태 변경
  async updateStatus(
    id: string,
    status: RideStatus,
    userId?: string,
    location?: { latitude: number; longitude: number },
    note?: string,
  ): Promise<RideSchedule> {
    const schedule = await this.getScheduleById(id);
    schedule.status = status;
    await this.rideScheduleRepository.save(schedule);

    // 기록 저장
    await this.rideRecordRepository.save({
      scheduleId: id,
      status,
      recordedBy: userId,
      location,
      note,
    });

    return schedule;
  }

  async getScheduleRecords(scheduleId: string): Promise<RideRecord[]> {
    return this.rideRecordRepository.find({
      where: { scheduleId },
      relations: ['recorder'],
      order: { recordedAt: 'ASC' },
    });
  }

  // 차량
  async createVehicle(dto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create(dto);
    return this.vehicleRepository.save(vehicle);
  }

  async getVehicles(organizationId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { organizationId, status: VehicleStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  async getVehicleById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException('차량을 찾을 수 없습니다');
    }
    return vehicle;
  }

  async updateVehicle(id: string, dto: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = await this.getVehicleById(id);
    Object.assign(vehicle, dto);
    return this.vehicleRepository.save(vehicle);
  }

  async deleteVehicle(id: string): Promise<void> {
    const vehicle = await this.getVehicleById(id);
    vehicle.status = VehicleStatus.INACTIVE;
    await this.vehicleRepository.save(vehicle);
  }

  // 통계
  async getDailyStats(organizationId: string, date: Date) {
    const schedules = await this.getSchedulesByDate(organizationId, date);
    
    const total = schedules.length;
    const byStatus = schedules.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byRouteType = schedules.reduce((acc, s) => {
      acc[s.routeType] = (acc[s.routeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, byStatus, byRouteType };
  }
}
