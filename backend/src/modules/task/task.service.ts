import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { PaginationDto } from '../../common/dto';

export class CreateTaskDto {
  organizationId: string;
  name: string;
  description?: string;
  priority?: TaskPriority;
  dueAt?: Date;
  checklist?: { id: string; text: string; checked: boolean }[];
  approvalRequired?: boolean;
  assigneeIds?: string[];
}

export class UpdateTaskStatusDto {
  status: TaskStatus;
  note?: string;
}

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskAssignee)
    private assigneeRepository: Repository<TaskAssignee>,
  ) {}

  async create(dto: CreateTaskDto, userId?: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...dto,
      createdBy: userId,
    });
    const savedTask = await this.taskRepository.save(task);

    // 담당자 할당
    if (dto.assigneeIds?.length) {
      const assignees = dto.assigneeIds.map((uid) => ({
        taskId: savedTask.id,
        userId: uid,
      }));
      await this.assigneeRepository.save(assignees);
    }

    return savedTask;
  }

  async findAll(organizationId: string, pagination: PaginationDto) {
    const [tasks, total] = await this.taskRepository.findAndCount({
      where: { organizationId },
      relations: ['creator'],
      skip: pagination.skip,
      take: pagination.limit,
      order: { createdAt: 'DESC' },
    });
    return { tasks, total };
  }

  async findByUser(userId: string, pagination: PaginationDto) {
    const [assignees, total] = await this.assigneeRepository.findAndCount({
      where: { userId },
      relations: ['task', 'task.organization'],
      skip: pagination.skip,
      take: pagination.limit,
    });
    return {
      tasks: assignees.map((a) => ({ ...a.task, assigneeStatus: a.status })),
      total,
    };
  }

  async findById(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['organization', 'creator'],
    });
    if (!task) {
      throw new NotFoundException('업무를 찾을 수 없습니다');
    }
    return task;
  }

  async getAssignees(taskId: string): Promise<TaskAssignee[]> {
    return this.assigneeRepository.find({
      where: { taskId },
      relations: ['user'],
    });
  }

  async update(id: string, dto: Partial<CreateTaskDto>): Promise<Task> {
    const task = await this.findById(id);
    Object.assign(task, dto);
    return this.taskRepository.save(task);
  }

  async updateStatus(
    taskId: string,
    userId: string,
    dto: UpdateTaskStatusDto,
  ): Promise<TaskAssignee> {
    const assignee = await this.assigneeRepository.findOne({
      where: { taskId, userId },
    });
    if (!assignee) {
      throw new NotFoundException('업무 담당자를 찾을 수 없습니다');
    }

    assignee.status = dto.status;
    if (dto.note !== undefined) {
      assignee.note = dto.note;
    }

    if (dto.status === TaskStatus.IN_PROGRESS && !assignee.startedAt) {
      assignee.startedAt = new Date();
    }
    if (dto.status === TaskStatus.COMPLETED || dto.status === TaskStatus.IMPOSSIBLE) {
      assignee.completedAt = new Date();
    }

    return this.assigneeRepository.save(assignee);
  }

  async delete(id: string): Promise<void> {
    await this.taskRepository.delete(id);
  }

  async getStats(organizationId: string) {
    const byStatus = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('task.organization_id = :organizationId', { organizationId })
      .groupBy('task.status')
      .getRawMany();

    const byPriority = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('task.organization_id = :organizationId', { organizationId })
      .groupBy('task.priority')
      .getRawMany();

    const total = await this.taskRepository.count({ where: { organizationId } });

    return { total, byStatus, byPriority };
  }

  async getTodayTasks(userId: string): Promise<TaskAssignee[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.assigneeRepository
      .createQueryBuilder('assignee')
      .leftJoinAndSelect('assignee.task', 'task')
      .where('assignee.user_id = :userId', { userId })
      .andWhere('task.due_at >= :today', { today })
      .andWhere('task.due_at < :tomorrow', { tomorrow })
      .orderBy('task.due_at', 'ASC')
      .getMany();
  }
}
