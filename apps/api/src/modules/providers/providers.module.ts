import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { EnrichmentProcessor } from './enrichment.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'enrichment',
    }),
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService, EnrichmentProcessor],
  exports: [ProvidersService],
})
export class ProvidersModule {}
