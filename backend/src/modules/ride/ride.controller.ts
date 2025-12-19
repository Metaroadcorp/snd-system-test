import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  RideService,
  CreateRideScheduleDto,
  UpdateRideScheduleDto,
  CreateVehicleDto,
} from './ride.service';
import { RideStatus, RouteType } from './entities/ride-schedule.entity';
import { ApiResponse } from '../../common/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { id: string; email: string; role: string };
}

@ApiTags('Rides')
@Controller('rides')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RideController {
  constructor(private readonly rideService: RideService) {}

  // 송영 스케줄
  @Post('schedules')
  @ApiOperation({ summary: '송영 스케줄 생성' })
  async createSchedule(@Body() dto: CreateRideScheduleDto) {
    const schedule = await this.rideService.createSchedule(dto);
    return ApiResponse.success(schedule, '송영 스케줄이 생성되었습니다');
  }

  @Post('schedules/bulk')
  @ApiOperation({ summary: '송영 스케줄 일괄 생성' })
  async createBulkSchedules(@Body() dtos: CreateRideScheduleDto[]) {
    const schedules = await this.rideService.createBulkSchedules(dtos);
    return ApiResponse.success(schedules, `${schedules.length}건의 송영 스케줄이 생성되었습니다`);
  }

  @Get('schedules')
  @ApiOperation({ summary: '날짜별 송영 스케줄 조회' })
  async getSchedulesByDate(
    @Query('organizationId') organizationId: string,
    @Query('date') date: string,
    @Query('routeType') routeType?: RouteType,
  ) {
    const schedules = await this.rideService.getSchedulesByDate(
      organizationId,
      new Date(date),
      routeType,
    );
    return ApiResponse.success(schedules);
  }

  @Get('schedules/range')
  @ApiOperation({ summary: '기간별 송영 스케줄 조회' })
  async getSchedulesByRange(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const schedules = await this.rideService.getSchedulesByDateRange(
      organizationId,
      new Date(startDate),
      new Date(endDate),
    );
    return ApiResponse.success(schedules);
  }

  @Get('schedules/stats')
  @ApiOperation({ summary: '일별 송영 통계' })
  async getDailyStats(
    @Query('organizationId') organizationId: string,
    @Query('date') date: string,
  ) {
    const stats = await this.rideService.getDailyStats(
      organizationId,
      new Date(date),
    );
    return ApiResponse.success(stats);
  }

  @Get('schedules/:id')
  @ApiOperation({ summary: '송영 스케줄 상세 조회' })
  async getScheduleById(@Param('id') id: string) {
    const schedule = await this.rideService.getScheduleById(id);
    return ApiResponse.success(schedule);
  }

  @Put('schedules/:id')
  @ApiOperation({ summary: '송영 스케줄 수정' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateRideScheduleDto,
  ) {
    const schedule = await this.rideService.updateSchedule(id, dto);
    return ApiResponse.success(schedule, '송영 스케줄이 수정되었습니다');
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: '송영 스케줄 삭제' })
  async deleteSchedule(@Param('id') id: string) {
    await this.rideService.deleteSchedule(id);
    return ApiResponse.success(null, '송영 스케줄이 삭제되었습니다');
  }

  // 상태 변경
  @Post('schedules/:id/status')
  @ApiOperation({ summary: '송영 상태 변경' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: {
      status: RideStatus;
      location?: { latitude: number; longitude: number };
      note?: string;
    },
    @Request() req: AuthRequest,
  ) {
    const schedule = await this.rideService.updateStatus(
      id,
      body.status,
      req.user.id,
      body.location,
      body.note,
    );
    return ApiResponse.success(schedule, '상태가 변경되었습니다');
  }

  @Get('schedules/:id/records')
  @ApiOperation({ summary: '송영 기록 조회' })
  async getScheduleRecords(@Param('id') id: string) {
    const records = await this.rideService.getScheduleRecords(id);
    return ApiResponse.success(records);
  }

  // 차량
  @Post('vehicles')
  @ApiOperation({ summary: '차량 등록' })
  async createVehicle(@Body() dto: CreateVehicleDto) {
    const vehicle = await this.rideService.createVehicle(dto);
    return ApiResponse.success(vehicle, '차량이 등록되었습니다');
  }

  @Get('vehicles')
  @ApiOperation({ summary: '차량 목록 조회' })
  async getVehicles(@Query('organizationId') organizationId: string) {
    const vehicles = await this.rideService.getVehicles(organizationId);
    return ApiResponse.success(vehicles);
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: '차량 상세 조회' })
  async getVehicleById(@Param('id') id: string) {
    const vehicle = await this.rideService.getVehicleById(id);
    return ApiResponse.success(vehicle);
  }

  @Put('vehicles/:id')
  @ApiOperation({ summary: '차량 정보 수정' })
  async updateVehicle(
    @Param('id') id: string,
    @Body() dto: Partial<CreateVehicleDto>,
  ) {
    const vehicle = await this.rideService.updateVehicle(id, dto);
    return ApiResponse.success(vehicle, '차량 정보가 수정되었습니다');
  }

  @Delete('vehicles/:id')
  @ApiOperation({ summary: '차량 삭제' })
  async deleteVehicle(@Param('id') id: string) {
    await this.rideService.deleteVehicle(id);
    return ApiResponse.success(null, '차량이 삭제되었습니다');
  }
}
