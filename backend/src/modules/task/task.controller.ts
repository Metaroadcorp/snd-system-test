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
import { TaskService, CreateTaskDto, UpdateTaskStatusDto } from './task.service';
import { ApiResponse, PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { id: string; email: string; role: string };
}

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: '업무 생성' })
  async create(@Body() dto: CreateTaskDto, @Request() req: AuthRequest) {
    const task = await this.taskService.create(dto, req.user.id);
    return ApiResponse.success(task, '업무가 생성되었습니다');
  }

  @Get()
  @ApiOperation({ summary: '업무 목록 (조직)' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query() pagination: PaginationDto,
  ) {
    const { tasks, total } = await this.taskService.findAll(organizationId, pagination);
    return ApiResponse.paginated(tasks, total, pagination.page, pagination.limit);
  }

  @Get('my')
  @ApiOperation({ summary: '내 업무 목록' })
  async findMyTasks(@Request() req: AuthRequest, @Query() pagination: PaginationDto) {
    const { tasks, total } = await this.taskService.findByUser(req.user.id, pagination);
    return ApiResponse.paginated(tasks, total, pagination.page, pagination.limit);
  }

  @Get('my/today')
  @ApiOperation({ summary: '오늘의 내 업무' })
  async getTodayTasks(@Request() req: AuthRequest) {
    const tasks = await this.taskService.getTodayTasks(req.user.id);
    return ApiResponse.success(tasks);
  }

  @Get('stats')
  @ApiOperation({ summary: '업무 통계' })
  async getStats(@Query('organizationId') organizationId: string) {
    const stats = await this.taskService.getStats(organizationId);
    return ApiResponse.success(stats);
  }

  @Get(':id')
  @ApiOperation({ summary: '업무 상세' })
  async findById(@Param('id') id: string) {
    const task = await this.taskService.findById(id);
    return ApiResponse.success(task);
  }

  @Get(':id/assignees')
  @ApiOperation({ summary: '업무 담당자 목록' })
  async getAssignees(@Param('id') id: string) {
    const assignees = await this.taskService.getAssignees(id);
    return ApiResponse.success(assignees);
  }

  @Put(':id')
  @ApiOperation({ summary: '업무 수정' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateTaskDto>) {
    const task = await this.taskService.update(id, dto);
    return ApiResponse.success(task, '업무가 수정되었습니다');
  }

  @Put(':id/status')
  @ApiOperation({ summary: '내 업무 상태 변경 (진행중/완료/불가)' })
  async updateStatus(
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
    @Request() req: AuthRequest,
  ) {
    const assignee = await this.taskService.updateStatus(taskId, req.user.id, dto);
    return ApiResponse.success(assignee, '상태가 변경되었습니다');
  }

  @Delete(':id')
  @ApiOperation({ summary: '업무 삭제' })
  async delete(@Param('id') id: string) {
    await this.taskService.delete(id);
    return ApiResponse.success(null, '업무가 삭제되었습니다');
  }
}
