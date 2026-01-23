import { Module } from '@nestjs/common';
import { VirtualFilterService } from './virtual-filter.service';
import { FilterController } from './filter.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ScoreModule } from '../score/score.module';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, ScoreModule, RBACModule],
  controllers: [FilterController],
  providers: [VirtualFilterService],
  exports: [VirtualFilterService],
})
export class FilterModule {}
