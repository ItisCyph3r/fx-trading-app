import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../common/enums/role.enum';
import { GetTransactionQuery } from './dto/transactions.dto';
// import { GetTransactionQuery } from './dto/get-transaction-query.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionController {
    constructor(private readonly txService: TransactionService) {}

    @Get()
    @Roles(Role.ADMIN, Role.USER)
    async getTransactions(@Req() req, @Query() query: GetTransactionQuery) {
        const userId = req.user.role === Role.ADMIN ? undefined : req.user.userId;
        return this.txService.getUserTransactions(userId, query);
    }
}