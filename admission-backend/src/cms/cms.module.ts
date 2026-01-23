import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { RBACModule } from '../rbac/rbac.module';
import { SearchService } from './search.service';

@Module({
  imports: [PrismaModule, StorageModule, RBACModule],
  controllers: [CmsController],
  providers: [CmsService, SearchService],
  exports: [CmsService, SearchService],
})
export class CmsModule { }

