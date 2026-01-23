import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, StorageModule, RBACModule],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
