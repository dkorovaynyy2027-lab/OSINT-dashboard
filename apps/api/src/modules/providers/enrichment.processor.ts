import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseProvider } from '@osint/plugin-sdk';
// In a real scenario, providers would be dynamically loaded or injected
import { ShodanProvider } from './integrations/shodan.provider';
import { HibpProvider } from './integrations/hibp.provider';
import { VirusTotalProvider } from './integrations/virustotal.provider';
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
    this.providers.push(new HibpProvider({
      apiKey: this.configService.get('HIBP_API_KEY'),
    }));
    this.providers.push(new VirusTotalProvider({
      apiKey: this.configService.get('VIRUSTOTAL_API_KEY'),
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
          
          // Persist raw result
          const pr = await this.prisma.providerResult.create({
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

          // Phase 1: Create Findings from riskSignals
          if (resultEnvelope.riskSignals && resultEnvelope.riskSignals.length > 0) {
            for (const signal of resultEnvelope.riskSignals) {
              await this.prisma.finding.create({
                data: {
                  entityId,
                  source: provider.meta.name,
                  type: signal.type,
                  severity: signal.severity as any,
                  score: signal.score,
                  title: `${signal.severity} signal from ${provider.meta.name}`,
                  description: signal.description,
                },
              });
            }
          }

          // Phase 1: Create EntityRelations
          if (resultEnvelope.relatedEntities && resultEnvelope.relatedEntities.length > 0) {
            for (const rel of resultEnvelope.relatedEntities) {
              const relNormalized = rel.value.trim().toLowerCase();
              
              // Ensure the target entity exists
              const toEntity = await this.prisma.entity.upsert({
                where: { kind_normalized: { kind: rel.kind as any, normalized: relNormalized } },
                update: {},
                create: {
                  kind: rel.kind as any,
                  value: rel.value,
                  normalized: relNormalized,
                  createdById: job.data.requestedBy, // attribute to the user who ran the enrichment
                },
              });

              // Create relation (ignore if exists due to unique constraint, or use upsert)
              await this.prisma.entityRelation.upsert({
                where: {
                  fromId_toId_relation_source: {
                    fromId: entityId,
                    toId: toEntity.id,
                    relation: rel.relation,
                    source: provider.meta.name,
                  }
                },
                update: { confidence: rel.confidence },
                create: {
                  fromId: entityId,
                  toId: toEntity.id,
                  relation: rel.relation,
                  source: provider.meta.name,
                  confidence: rel.confidence,
                },
              });
            }
          }

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
