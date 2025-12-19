import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ElderModule } from './modules/elder/elder.module';
import { RideModule } from './modules/ride/ride.module';
import { BroadcastModule } from './modules/broadcast/broadcast.module';
import { TaskModule } from './modules/task/task.module';
import { NotificationModule } from './modules/notification/notification.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // 환경변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'snd_user'),
        password: configService.get('DB_PASSWORD', 'snd_password_2024'),
        database: configService.get('DB_DATABASE', 'snd_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development', // 개발환경에서만 true
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),

    // 기능 모듈
    AuthModule,
    UserModule,
    OrganizationModule,
    ElderModule,
    RideModule,
    BroadcastModule,
    TaskModule,
    NotificationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
