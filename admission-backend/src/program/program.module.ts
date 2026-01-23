import { Module } from '@nestjs/common';
import { ProgramService } from './program.service';
import { ProgramController } from './program.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RBACModule],
  controllers: [ProgramController],
  providers: [ProgramService],
  exports: [ProgramService],
})
export class ProgramModule {}
