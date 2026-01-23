import { Module } from '@nestjs/common';
import { ResultExportService } from './result-export.service';
import { ResultController } from './result.controller';
import { ResultLookupController } from './result-lookup.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RBACModule],
  providers: [ResultExportService],
  controllers: [ResultController, ResultLookupController],
  exports: [ResultExportService],
})
export class ResultModule {}
