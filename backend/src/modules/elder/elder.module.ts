import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElderController } from './elder.controller';
import { ElderService } from './elder.service';
import { Elder } from './entities/elder.entity';
import { Guardian } from './entities/guardian.entity';
import { ElderGuardian } from './entities/elder-guardian.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Elder, Guardian, ElderGuardian])],
  controllers: [ElderController],
  providers: [ElderService],
  exports: [ElderService],
})
export class ElderModule {}
