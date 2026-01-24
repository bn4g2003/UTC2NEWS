import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RBACModule } from './rbac/rbac.module';
import { UsersModule } from './users/users.module';
import { CmsModule } from './cms/cms.module';
import { ProgramModule } from './program/program.module';
import { ImportModule } from './import/import.module';
import { StudentModule } from './student/student.module';
import { FilterModule } from './filter/filter.module';
import { ResultModule } from './result/result.module';
import { EmailModule } from './email/email.module';
import { ConfigModule } from './config/config.module';
import { CommunicationModule } from './communication/communication.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RBACModule,
    UsersModule,
    CmsModule,
    ProgramModule,
    ImportModule,
    StudentModule,
    FilterModule,
    ResultModule,
    EmailModule,
    ConfigModule,
    CommunicationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
