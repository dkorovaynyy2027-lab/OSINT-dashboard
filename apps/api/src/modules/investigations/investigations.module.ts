import { Module } from '@nestjs/common';
import { InvestigationsService } from './investigations.service';
import { InvestigationsController } from './investigations.controller';
import { GraphService } from './graph.service';

@Module({
  controllers: [InvestigationsController],
  providers: [InvestigationsService, GraphService],
  exports: [InvestigationsService, GraphService],
})
export class InvestigationsModule {}
