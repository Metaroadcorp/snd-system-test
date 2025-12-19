import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../user/user.service';
import { RefreshToken } from './entities/refresh-token.entity';
import {
  LoginDto,
  RegisterDto,
  TokenResponseDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async login(dto: LoginDto): Promise<TokenResponseDto & { user: any }> {
    const { email, phone, password } = dto;

    if (!email && !phone) {
      throw new BadRequestException('이메일 또는 전화번호가 필요합니다');
    }

    // 사용자 찾기
    let user;
    if (email) {
      user = await this.userService.findByEmail(email);
    } else if (phone) {
      user = await this.userService.findByPhone(phone);
    }

    if (!user) {
      throw new UnauthorizedException('계정을 찾을 수 없습니다');
    }

    // 비밀번호 확인
    const isValid = await this.userService.validatePassword(user, password);
    if (!isValid) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다');
    }

    // 마지막 로그인 시간 업데이트
    await this.userService.updateLastLogin(user.id);

    // 토큰 생성
    const tokens = await this.generateTokens(user);
    
    // user 정보와 함께 반환 (비밀번호 제외)
    const { passwordHash, ...userWithoutPassword } = user;
    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async register(dto: RegisterDto): Promise<TokenResponseDto> {
    const { email, phone, name, password } = dto;

    // 중복 체크
    if (email) {
      const existingEmail = await this.userService.findByEmail(email);
      if (existingEmail) {
        throw new ConflictException('이미 사용 중인 이메일입니다');
      }
    }

    if (phone) {
      const existingPhone = await this.userService.findByPhone(phone);
      if (existingPhone) {
        throw new ConflictException('이미 사용 중인 전화번호입니다');
      }
    }

    // 사용자 생성
    const user = await this.userService.create({
      email,
      phone,
      name,
      password,
    });

    // 토큰 생성
    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    // 리프레시 토큰 확인
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: {
        token: refreshToken,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!tokenEntity) {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다');
    }

    // 기존 토큰 삭제
    await this.refreshTokenRepository.delete({ id: tokenEntity.id });

    // 새 토큰 생성
    return this.generateTokens(tokenEntity.user);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.refreshTokenRepository.delete({ token: refreshToken });
    } else {
      await this.refreshTokenRepository.delete({ userId });
    }
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<boolean> {
    const user = await this.userService.findById(userId);

    // 현재 비밀번호 확인
    const isValid = await this.userService.validatePassword(
      user,
      dto.currentPassword,
    );
    if (!isValid) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다');
    }

    // 새 비밀번호로 업데이트
    await this.userService.update(userId, { password: dto.newPassword });

    // 모든 리프레시 토큰 삭제 (다른 기기 로그아웃)
    await this.refreshTokenRepository.delete({ userId });

    return true;
  }

  private async generateTokens(user: any): Promise<TokenResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
    };

    const expiresIn = this.configService.get('JWT_EXPIRES_IN', '1d');
    const refreshExpiresIn = this.configService.get(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    // Access Token 생성
    const accessToken = this.jwtService.sign(payload, {
      expiresIn,
    });

    // Refresh Token 생성 및 저장
    const refreshToken = uuidv4();
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(
      refreshExpiresAt.getDate() + parseInt(refreshExpiresIn),
    );

    await this.refreshTokenRepository.save({
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshExpiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiresIn(expiresIn),
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60;
      case 'h':
        return value * 60 * 60;
      case 'm':
        return value * 60;
      default:
        return value;
    }
  }
}
