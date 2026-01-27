import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Parser } from 'expr-eval';

@Injectable()
export class FormulaService {
    private parser = new Parser();

    constructor(private readonly prisma: PrismaService) {
        // Đăng ký các hàm tùy chỉnh
        this.parser.functions.max = (...args: number[]) => Math.max(...args);

        // Hàm tính điểm xét tuyển theo quy chế (có giảm trừ điểm ưu tiên nếu điểm cao)
        // Cú pháp: effective_score(tổng_điểm_thô, điểm_ưu_tiên)
        this.parser.functions.effective_score = (total: number, priority: number) => {
            if (total < 22.5) {
                return total + priority;
            } else {
                // Công thức quy chế mới: Điểm ƯT = [(30 - Tổng điểm đạt được) / 7.5] × Mức điểm ưu tiên
                // Tránh trường hợp total > 30 gây điểm âm (dù hiếm)
                const adjustedPriority = Math.max(0, ((30 - total) / 7.5) * priority);
                return total + adjustedPriority;
            }
        };
    }

    async create(data: { name: string; formula: string; description?: string }) {
        // Validate formula
        try {
            this.parser.parse(data.formula);
        } catch (e) {
            throw new ConflictException(`Invalid formula: ${e.message}`);
        }

        return this.prisma.admissionFormula.create({
            data,
        });
    }

    async findAll() {
        return this.prisma.admissionFormula.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const formula = await this.prisma.admissionFormula.findUnique({
            where: { id },
        });

        if (!formula) {
            throw new NotFoundException(`Formula with ID ${id} not found`);
        }

        return formula;
    }

    async update(id: string, data: { name?: string; formula?: string; description?: string }) {
        if (data.formula) {
            try {
                this.parser.parse(data.formula);
            } catch (e) {
                throw new ConflictException(`Invalid formula: ${e.message}`);
            }
        }

        return this.prisma.admissionFormula.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        // Check if being used by quotas
        const usage = await this.prisma.sessionQuota.count({
            where: { formulaId: id },
        });

        if (usage > 0) {
            throw new ConflictException(`Formula is being used in ${usage} quotas and cannot be deleted.`);
        }

        return this.prisma.admissionFormula.delete({
            where: { id },
        });
    }

    /**
     * Evaluate a formula with context
     */
    evaluate(formulaStr: string, context: Record<string, any>): number {
        try {
            const expr = this.parser.parse(formulaStr);
            const result = expr.evaluate(context);
            return typeof result === 'number' ? result : 0;
        } catch (e) {
            console.error(`Error evaluating formula ${formulaStr}:`, e);
            return 0;
        }
    }
}
