import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { FormulaService } from './formula.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../rbac/roles.guard'; // File not found

@ApiTags('formulas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('formulas')
export class FormulaController {
    constructor(private readonly formulaService: FormulaService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new admission formula' })
    create(@Body() data: { name: string; formula: string; description?: string }) {
        return this.formulaService.create(data);
    }

    @Get()
    @ApiOperation({ summary: 'Get all admission formulas' })
    findAll() {
        return this.formulaService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a formula by ID' })
    findOne(@Param('id') id: string) {
        return this.formulaService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a formula' })
    update(@Param('id') id: string, @Body() data: { name?: string; formula?: string; description?: string }) {
        return this.formulaService.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a formula' })
    remove(@Param('id') id: string) {
        return this.formulaService.remove(id);
    }
}
