import { Module } from '@nestjs/common';
import { ScoreCalculationService } from './score-calculation.service';

@Module({
  providers: [ScoreCalculationService],
  exports: [ScoreCalculationService],
})
export class ScoreModule {}
