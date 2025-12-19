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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  AssignRoleDto,
  RegisterDeviceDto,
} from './dto/user.dto';
import { ApiResponse, PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { id: string; email: string; role: string };
}

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 목록 조회' })
  async findAll(@Query() pagination: PaginationDto) {
    const { users, total } = await this.userService.findAll(pagination);
    return ApiResponse.paginated(users, total, pagination.page, pagination.limit);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회' })
  async getMe(@Request() req: AuthRequest) {
    const user = await this.userService.findById(req.user.id);
    const organizations = await this.userService.getUserOrganizations(req.user.id);
    const roles = await this.userService.getUserRoles(req.user.id);
    return ApiResponse.success({ user, organizations, roles });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 상세 조회' })
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return ApiResponse.success(user);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 수정' })
  async updateMe(@Request() req: AuthRequest, @Body() dto: UpdateUserDto) {
    const user = await this.userService.update(req.user.id, dto);
    return ApiResponse.success(user, '정보가 수정되었습니다');
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 정보 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.userService.update(id, dto);
    return ApiResponse.success(user, '사용자 정보가 수정되었습니다');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 삭제' })
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
    return ApiResponse.success(null, '사용자가 삭제되었습니다');
  }

  @Post('me/devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '디바이스 등록 (푸시 토큰)' })
  async registerDevice(@Request() req: AuthRequest, @Body() dto: RegisterDeviceDto) {
    const device = await this.userService.registerDevice(req.user.id, dto);
    return ApiResponse.success(device, '디바이스가 등록되었습니다');
  }

  @Get('me/devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 디바이스 목록' })
  async getMyDevices(@Request() req: AuthRequest) {
    const devices = await this.userService.getActiveDevices(req.user.id);
    return ApiResponse.success(devices);
  }

  @Post(':id/roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '역할 부여' })
  async assignRole(
    @Param('id') userId: string,
    @Body() dto: AssignRoleDto,
    @Request() req: AuthRequest,
  ) {
    const userRole = await this.userService.assignRole(
      userId,
      dto.roleId,
      dto.organizationId,
      req.user.id,
    );
    return ApiResponse.success(userRole, '역할이 부여되었습니다');
  }

  @Get(':id/roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 역할 조회' })
  async getUserRoles(@Param('id') userId: string) {
    const roles = await this.userService.getUserRoles(userId);
    return ApiResponse.success(roles);
  }
}
