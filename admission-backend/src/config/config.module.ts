import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RBACModule],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
