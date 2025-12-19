import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { ApiResponse, PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { id: string; email: string; role: string };
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '내 알림 목록' })
  async findAll(@Request() req: AuthRequest, @Query() pagination: PaginationDto) {
    const { notifications, total } = await this.notificationService.findByUser(
      req.user.id,
      pagination,
    );
    return ApiResponse.paginated(notifications, total, pagination.page, pagination.limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '읽지 않은 알림 수' })
  async getUnreadCount(@Request() req: AuthRequest) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return ApiResponse.success({ count });
  }

  @Put(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationService.markAsRead(id);
    return ApiResponse.success(notification);
  }

  @Put('read-all')
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  async markAllAsRead(@Request() req: AuthRequest) {
    await this.notificationService.markAllAsRead(req.user.id);
    return ApiResponse.success(null, '모든 알림을 읽음 처리했습니다');
  }

  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제' })
  async delete(@Param('id') id: string) {
    await this.notificationService.delete(id);
    return ApiResponse.success(null, '알림이 삭제되었습니다');
  }
}
