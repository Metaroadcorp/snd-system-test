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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  ElderService,
  CreateElderDto,
  UpdateElderDto,
  CreateGuardianDto,
} from './elder.service';
import { ApiResponse, PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Elders')
@Controller('elders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ElderController {
  constructor(private readonly elderService: ElderService) {}

  @Post()
  @ApiOperation({ summary: '어르신 등록' })
  async create(@Body() dto: CreateElderDto) {
    const elder = await this.elderService.create(dto);
    return ApiResponse.success(elder, '어르신이 등록되었습니다');
  }

  @Get()
  @ApiOperation({ summary: '어르신 목록 조회' })
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query() pagination: PaginationDto,
  ) {
    const { elders, total } = await this.elderService.findAll(
      organizationId,
      pagination,
    );
    return ApiResponse.paginated(elders, total, pagination.page, pagination.limit);
  }

  @Get('search')
  @ApiOperation({ summary: '어르신 검색' })
  async search(
    @Query('organizationId') organizationId: string,
    @Query('q') query: string,
    @Query() pagination: PaginationDto,
  ) {
    const { elders, total } = await this.elderService.search(
      organizationId,
      query,
      pagination,
    );
    return ApiResponse.paginated(elders, total, pagination.page, pagination.limit);
  }

  @Get('stats')
  @ApiOperation({ summary: '어르신 통계' })
  async getStats(@Query('organizationId') organizationId: string) {
    const stats = await this.elderService.getStatsByOrganization(organizationId);
    return ApiResponse.success(stats);
  }

  @Get(':id')
  @ApiOperation({ summary: '어르신 상세 조회' })
  async findOne(@Param('id') id: string) {
    const elder = await this.elderService.findById(id);
    return ApiResponse.success(elder);
  }

  @Put(':id')
  @ApiOperation({ summary: '어르신 정보 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateElderDto) {
    const elder = await this.elderService.update(id, dto);
    return ApiResponse.success(elder, '어르신 정보가 수정되었습니다');
  }

  @Delete(':id')
  @ApiOperation({ summary: '어르신 삭제' })
  async delete(@Param('id') id: string) {
    await this.elderService.delete(id);
    return ApiResponse.success(null, '어르신이 삭제되었습니다');
  }

  // 보호자 관련
  @Post(':id/guardians')
  @ApiOperation({ summary: '보호자 추가' })
  async addGuardian(
    @Param('id') elderId: string,
    @Body() dto: CreateGuardianDto,
    @Query('isPrimary') isPrimary?: boolean,
  ) {
    const guardian = await this.elderService.addGuardian(
      elderId,
      dto,
      isPrimary,
    );
    return ApiResponse.success(guardian, '보호자가 추가되었습니다');
  }

  @Get(':id/guardians')
  @ApiOperation({ summary: '보호자 목록' })
  async getGuardians(@Param('id') elderId: string) {
    const guardians = await this.elderService.getGuardians(elderId);
    return ApiResponse.success(guardians);
  }

  @Delete(':id/guardians/:guardianId')
  @ApiOperation({ summary: '보호자 삭제' })
  async removeGuardian(
    @Param('id') elderId: string,
    @Param('guardianId') guardianId: string,
  ) {
    await this.elderService.removeGuardian(elderId, guardianId);
    return ApiResponse.success(null, '보호자가 삭제되었습니다');
  }
}
