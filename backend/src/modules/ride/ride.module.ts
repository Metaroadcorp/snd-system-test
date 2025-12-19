import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';
import { RideSchedule } from './entities/ride-schedule.entity';
import { RideRecord } from './entities/ride-record.entity';
import { Vehicle } from './entities/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RideSchedule, RideRecord, Vehicle])],
  controllers: [RideController],
  providers: [RideService],
  exports: [RideService],
})
export class RideModule {}
