import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderRegistry } from './provider.registry';

@Processor('enrichment')
@Injectable()
export class EnrichmentProcessor extends WorkerHost {
  private readonly logger = new Logger(EnrichmentProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRegistry: ProviderRegistry,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing enrichment job ${job.id} for entity ${job.data.entityId}`);
    const { entityId, entityKind, value, requestedProviders } = job.data;

    const availableProviders = this.providerRegistry.getProvidersForEntity(entityKind);
    
    const providersToRun = requestedProviders 
      ? availableProviders.filter(p => requestedProviders.includes(p.meta.name))
      : availableProviders;

    if (providersToRun.length === 0) {
      this.logger.warn(`No suitable providers found for ${entityKind} / ${value}`);
      return { successCount: 0, errorCount: 0 };
    }

    let successCount = 0;
    let errorCount = 0;

    await Promise.allSettled(
      providersToRun.map(async (provider) => {
        try {
          const resultEnvelope = await provider.run({ entityKind, value });
          
          // Persist raw result
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

          // Create Findings from riskSignals
          if (resultEnvelope.riskSignals?.length) {
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

          // Create EntityRelations
          if (resultEnvelope.relatedEntities?.length) {
            for (const rel of resultEnvelope.relatedEntities) {
              const relNormalized = rel.value.trim().toLowerCase();
              
              const toEntity = await this.prisma.entity.upsert({
                where: { kind_normalized: { kind: rel.kind as any, normalized: relNormalized } },
                update: {},
                create: {
                  kind: rel.kind as any,
                  value: rel.value,
                  normalized: relNormalized,
                  createdById: job.data.requestedBy,
                },
              });

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
        } catch (error) {
          this.logger.error(`Provider ${provider.meta.name} failed:`, error);
          errorCount++;
        }
      })
    );

    await job.updateProgress(100);
    this.logger.log(`Job ${job.id} done. Success: ${successCount}, Errors: ${errorCount}`);

    return { totalProviders: providersToRun.length, successCount, errorCount };
  }
}
