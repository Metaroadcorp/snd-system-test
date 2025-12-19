import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { PaginationDto } from '../../common/dto';

export class CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    return this.notificationRepository.save(notification);
  }

  async createBulk(dtos: CreateNotificationDto[]): Promise<Notification[]> {
    const notifications = this.notificationRepository.create(dtos);
    return this.notificationRepository.save(notifications);
  }

  async findByUser(userId: string, pagination: PaginationDto) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      skip: pagination.skip,
      take: pagination.limit,
      order: { createdAt: 'DESC' },
    });
    return { notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (notification && !notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      return this.notificationRepository.save(notification);
    }
    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async delete(id: string): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  async deleteOld(days: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();
  }

  // 푸시 알림 전송 (Expo Push)
  async sendPush(
    userIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // 알림 저장
    const notifications = userIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      data,
    }));
    await this.createBulk(notifications);

    // TODO: Expo Push API 연동
    // expo-server-sdk를 사용하여 푸시 전송
  }
}
