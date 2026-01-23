import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ScoreModule } from '../score/score.module';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, ScoreModule, RBACModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
