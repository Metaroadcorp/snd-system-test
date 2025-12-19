import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BroadcastController } from './broadcast.controller';
import { BroadcastService } from './broadcast.service';
import { BroadcastTemplate } from './entities/broadcast-template.entity';
import { BroadcastSchedule } from './entities/broadcast-schedule.entity';
import { BroadcastRun } from './entities/broadcast-run.entity';
import { BroadcastFile } from './entities/broadcast-file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BroadcastTemplate,
      BroadcastSchedule,
      BroadcastRun,
      BroadcastFile,
    ]),
  ],
  controllers: [BroadcastController],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}
