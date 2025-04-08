// import { Query } from '@nestjs/common';

// @Get()
// async getTransactions(@Req() req, @Query() query) {
//   return this.txService.getUserTransactions(req.user.userId, query);
// }

import {
    Controller,
    Get,
    Query,
    Req,
    UseGuards,
  } from '@nestjs/common';
import { TransactionService } from './transaction.service';
//   import { TransactionService } from './transaction.service';
//   import { Roles } from 'src/common/decorators/roles.decorator';
//   import { Role } from 'src/common/enums/role.enum';
//   import { RolesGuard } from 'src/common/guards/roles.guard';
  
  @Controller('transactions')
  @UseGuards(RolesGuard)
  export class TransactionController {
    constructor(private readonly txService: TransactionService) {}
  
    @Get()
    @Roles(Role.ADMIN, Role.USER)
    async getTransactions(@Req() req, @Query() query) {
      const userId =
        req.user.role === Role.ADMIN ? undefined : req.user.userId;
      return this.txService.getUserTransactions(userId, query);
    }
  }
  