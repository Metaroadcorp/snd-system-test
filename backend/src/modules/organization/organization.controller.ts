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
  OrganizationService,
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './organization.service';
import { ApiResponse, PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '조직 생성' })
  async create(@Body() dto: CreateOrganizationDto) {
    const org = await this.orgService.create(dto);
    return ApiResponse.success(org, '조직이 생성되었습니다');
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '조직 목록 조회' })
  async findAll(@Query() pagination: PaginationDto) {
    const { organizations, total } = await this.orgService.findAll(pagination);
    return ApiResponse.paginated(
      organizations,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  @Get('types')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '조직 유형 목록' })
  async getOrgTypes() {
    const types = await this.orgService.getOrgTypes();
    return ApiResponse.success(types);
  }

  @Get('roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '시스템 역할 목록' })
  async getSystemRoles() {
    const roles = await this.orgService.getSystemRoles();
    return ApiResponse.success(roles);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '조직 상세 조회' })
  async findOne(@Param('id') id: string) {
    const org = await this.orgService.findById(id);
    return ApiResponse.success(org);
  }

  @Get(':id/children')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '하위 조직 조회' })
  async findChildren(@Param('id') id: string) {
    const children = await this.orgService.findChildren(id);
    return ApiResponse.success(children);
  }

  @Get(':id/roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '조직 역할 목록' })
  async getRoles(@Param('id') id: string) {
    const roles = await this.orgService.getRoles(id);
    return ApiResponse.success(roles);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '조직 정보 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    const org = await this.orgService.update(id, dto);
    return ApiResponse.success(org, '조직 정보가 수정되었습니다');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '조직 삭제' })
  async delete(@Param('id') id: string) {
    await this.orgService.delete(id);
    return ApiResponse.success(null, '조직이 삭제되었습니다');
  }
}
