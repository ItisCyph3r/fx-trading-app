// import { Module, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FxService } from './fx.service';
import { FxController } from './fx.controller';
import { FxRate } from './entities/fx-rate.entity';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([FxRate])
  ],
  providers: [FxService],
  controllers: [FxController],
  exports: [FxService],
})
export class FxModule {}
