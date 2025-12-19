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
  BroadcastService,
  CreateTemplateDto,
  CreateScheduleDto,
} from './broadcast.service';
import { RunType } from './entities/broadcast-run.entity';
import { FileType } from './entities/broadcast-file.entity';
import { ApiResponse } from '../../common/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { id: string; email: string; role: string };
}

@ApiTags('Broadcasts')
@Controller('broadcasts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  // 템플릿
  @Post('templates')
  @ApiOperation({ summary: '방송 템플릿 생성' })
  async createTemplate(@Body() dto: CreateTemplateDto, @Request() req: AuthRequest) {
    const template = await this.broadcastService.createTemplate(dto, req.user.id);
    return ApiResponse.success(template, '템플릿이 생성되었습니다');
  }

  @Get('templates')
  @ApiOperation({ summary: '방송 템플릿 목록' })
  async getTemplates(@Query('organizationId') organizationId?: string) {
    const templates = await this.broadcastService.getTemplates(organizationId);
    return ApiResponse.success(templates);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '템플릿 상세 조회' })
  async getTemplateById(@Param('id') id: string) {
    const template = await this.broadcastService.getTemplateById(id);
    return ApiResponse.success(template);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: '템플릿 수정' })
  async updateTemplate(@Param('id') id: string, @Body() dto: Partial<CreateTemplateDto>) {
    const template = await this.broadcastService.updateTemplate(id, dto);
    return ApiResponse.success(template, '템플릿이 수정되었습니다');
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: '템플릿 삭제' })
  async deleteTemplate(@Param('id') id: string) {
    await this.broadcastService.deleteTemplate(id);
    return ApiResponse.success(null, '템플릿이 삭제되었습니다');
  }

  // 스케줄
  @Post('schedules')
  @ApiOperation({ summary: '방송 스케줄 생성' })
  async createSchedule(@Body() dto: CreateScheduleDto, @Request() req: AuthRequest) {
    const schedule = await this.broadcastService.createSchedule(dto, req.user.id);
    return ApiResponse.success(schedule, '스케줄이 생성되었습니다');
  }

  @Get('schedules')
  @ApiOperation({ summary: '방송 스케줄 목록' })
  async getSchedules(@Query('organizationId') organizationId: string) {
    const schedules = await this.broadcastService.getSchedules(organizationId);
    return ApiResponse.success(schedules);
  }

  @Get('schedules/today')
  @ApiOperation({ summary: '오늘의 방송 스케줄' })
  async getTodaySchedules(@Query('organizationId') organizationId: string) {
    const schedules = await this.broadcastService.getTodaySchedules(organizationId);
    return ApiResponse.success(schedules);
  }

  @Get('schedules/:id')
  @ApiOperation({ summary: '스케줄 상세 조회' })
  async getScheduleById(@Param('id') id: string) {
    const schedule = await this.broadcastService.getScheduleById(id);
    return ApiResponse.success(schedule);
  }

  @Put('schedules/:id')
  @ApiOperation({ summary: '스케줄 수정' })
  async updateSchedule(@Param('id') id: string, @Body() dto: Partial<CreateScheduleDto>) {
    const schedule = await this.broadcastService.updateSchedule(id, dto);
    return ApiResponse.success(schedule, '스케줄이 수정되었습니다');
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: '스케줄 삭제' })
  async deleteSchedule(@Param('id') id: string) {
    await this.broadcastService.deleteSchedule(id);
    return ApiResponse.success(null, '스케줄이 삭제되었습니다');
  }

  // 즉시 실행
  @Post('run')
  @ApiOperation({ summary: '방송 즉시 실행' })
  async runBroadcast(
    @Body() body: { templateId: string; organizationId: string },
    @Request() req: AuthRequest,
  ) {
    const run = await this.broadcastService.runBroadcast(
      body.templateId,
      body.organizationId,
      RunType.MANUAL,
      req.user.id,
    );
    return ApiResponse.success(run, '방송이 시작되었습니다');
  }

  @Get('runs')
  @ApiOperation({ summary: '방송 실행 이력' })
  async getRunHistory(
    @Query('organizationId') organizationId: string,
    @Query('limit') limit?: number,
  ) {
    const runs = await this.broadcastService.getRunHistory(organizationId, limit);
    return ApiResponse.success(runs);
  }

  // 파일 (슬라이드)
  @Post('files')
  @ApiOperation({ summary: '슬라이드 파일 등록' })
  async uploadFile(
    @Body() body: {
      organizationId: string;
      fileType: FileType;
      fileUrl: string;
      fileName?: string;
      durationSec?: number;
    },
  ) {
    const file = await this.broadcastService.uploadFile(
      body.organizationId,
      body.fileType,
      body.fileUrl,
      body.fileName,
      body.durationSec,
    );
    return ApiResponse.success(file, '파일이 등록되었습니다');
  }

  @Get('files')
  @ApiOperation({ summary: '슬라이드 파일 목록' })
  async getFiles(@Query('organizationId') organizationId: string) {
    const files = await this.broadcastService.getFiles(organizationId);
    return ApiResponse.success(files);
  }

  @Put('files/order')
  @ApiOperation({ summary: '슬라이드 순서 변경' })
  async updateFileOrder(@Body() files: { id: string; displayOrder: number }[]) {
    await this.broadcastService.updateFileOrder(files);
    return ApiResponse.success(null, '순서가 변경되었습니다');
  }

  @Delete('files/:id')
  @ApiOperation({ summary: '슬라이드 삭제' })
  async deleteFile(@Param('id') id: string) {
    await this.broadcastService.deleteFile(id);
    return ApiResponse.success(null, '파일이 삭제되었습니다');
  }
}
