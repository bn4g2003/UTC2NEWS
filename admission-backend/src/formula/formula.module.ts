import { Module } from '@nestjs/common';
import { FormulaService } from './formula.service';
import { FormulaController } from './formula.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FormulaController],
    providers: [FormulaService],
    exports: [FormulaService],
})
export class FormulaModule { }
