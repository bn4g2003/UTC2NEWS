import { Module } from '@nestjs/common';
import { ScoreCalculationService } from './score-calculation.service';
import { FormulaModule } from '../formula/formula.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [FormulaModule, PrismaModule],
  providers: [ScoreCalculationService],
  exports: [ScoreCalculationService],
})
export class ScoreModule { }
