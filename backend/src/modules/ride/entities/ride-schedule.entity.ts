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
import { Elder } from '../../elder/entities/elder.entity';
import { Vehicle } from './vehicle.entity';
import { User } from '../../user/entities/user.entity';

export enum RouteType {
  PICKUP = 'PICKUP',   // 등원
  DROPOFF = 'DROPOFF', // 하원
}

export enum RideStatus {
  WAITING = 'WAITING',     // 대기
  BOARDING = 'BOARDING',   // 탑승 중
  IN_TRANSIT = 'IN_TRANSIT', // 이동 중
  ARRIVED = 'ARRIVED',     // 도착
  CANCELLED = 'CANCELLED', // 취소
  NO_SHOW = 'NO_SHOW',     // 불참
}

@Entity('ride_schedule')
export class RideSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'service_date', type: 'date' })
  serviceDate: Date;

  @Column({ name: 'elder_id' })
  elderId: string;

  @Column({ name: 'route_type', type: 'enum', enum: RouteType })
  routeType: RouteType;

  @Column({ name: 'scheduled_time', type: 'time' })
  scheduledTime: string;

  @Column({ name: 'vehicle_id', nullable: true })
  vehicleId: string;

  @Column({ name: 'driver_id', nullable: true })
  driverId: string;

  @Column({ name: 'manager_ids', type: 'uuid', array: true, default: [] })
  managerIds: string[];

  @Column({ nullable: true })
  sequence: number;

  @Column({
    type: 'enum',
    enum: RideStatus,
    default: RideStatus.WAITING,
  })
  status: RideStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => Elder)
  @JoinColumn({ name: 'elder_id' })
  elder: Elder;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;
}
