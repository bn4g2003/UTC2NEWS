import { Module } from '@nestjs/common';
import { ExcelImportService } from './excel-import.service';
import { ImportValidationService } from './import-validation.service';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RBACModule } from '../rbac/rbac.module';
import { ScoreModule } from '../score/score.module';

@Module({
  imports: [PrismaModule, RBACModule, ScoreModule],
  controllers: [ImportController],
  providers: [ExcelImportService, ImportValidationService, ImportService],
  exports: [ExcelImportService, ImportValidationService, ImportService],
})
export class ImportModule {}
