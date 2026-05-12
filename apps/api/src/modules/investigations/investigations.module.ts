import { Module } from '@nestjs/common';
import { InvestigationsService } from './investigations.service';
import { InvestigationsController } from './investigations.controller';

@Module({
  controllers: [InvestigationsController],
  providers: [InvestigationsService],
  exports: [InvestigationsService],
})
export class InvestigationsModule {}
