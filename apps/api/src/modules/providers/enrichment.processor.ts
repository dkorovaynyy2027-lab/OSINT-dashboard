import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseProvider } from '@osint/plugin-sdk';
// In a real scenario, providers would be dynamically loaded or injected
import { ShodanProvider } from './integrations/shodan.provider';
import { ConfigService } from '@nestjs/config';

@Processor('enrichment')
@Injectable()
export class EnrichmentProcessor extends WorkerHost {
  private readonly logger = new Logger(EnrichmentProcessor.name);
  private providers: BaseProvider[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
    // Initialize providers (this could be automated/dynamic)
    this.providers.push(new ShodanProvider({
      apiKey: this.configService.get('SHODAN_API_KEY'),
    }));
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing enrichment job ${job.id} for entity ${job.data.entityId}`);
    const { entityId, entityKind, value, requestedProviders } = job.data;

    const availableProviders = this.providers.filter(p => p.isEnabled() && p.supports(entityKind));
    
    const providersToRun = requestedProviders 
      ? availableProviders.filter(p => requestedProviders.includes(p.meta.name))
      : availableProviders;

    if (providersToRun.length === 0) {
      this.logger.warn(`No suitable providers found for ${entityKind} / ${value}`);
      return { successCount: 0, errorCount: 0 };
    }

    let successCount = 0;
    let errorCount = 0;

    const results = await Promise.allSettled(
      providersToRun.map(async (provider) => {
        try {
          const resultEnvelope = await provider.run({ entityKind, value });
          
          // Persist result
          await this.prisma.providerResult.create({
            data: {
              entityId,
              provider: provider.meta.name,
              status: resultEnvelope.status,
              durationMs: resultEnvelope.durationMs,
              data: resultEnvelope.data as any,
              error: resultEnvelope.error,
              fetchedAt: new Date(resultEnvelope.fetchedAt),
            },
          });

          // Phase 2: Create Findings if there are riskSignals
          // Phase 2: Create EntityRelations if there are relatedEntities

          successCount++;
          return resultEnvelope;
        } catch (error) {
          this.logger.error(`Provider ${provider.meta.name} failed:`, error);
          errorCount++;
          throw error;
        }
      })
    );

    await job.updateProgress(100);
    this.logger.log(`Job ${job.id} done. Success: ${successCount}, Errors: ${errorCount}`);

    return { totalProviders: providersToRun.length, successCount, errorCount };
  }
}
