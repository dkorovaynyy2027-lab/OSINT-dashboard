import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntityDto, SessionUser } from '@osint/types';

@Injectable()
export class EntitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEntityDto, user: SessionUser) {
    const normalized = dto.value.trim().toLowerCase();
    
    // Upsert or create
    return this.prisma.entity.upsert({
      where: {
        kind_normalized: {
          kind: dto.kind as any,
          normalized,
        },
      },
      update: {
        notes: dto.notes,
        investigationId: dto.investigationId,
      },
      create: {
        kind: dto.kind as any,
        value: dto.value,
        normalized,
        notes: dto.notes,
        investigationId: dto.investigationId,
        createdById: user.id,
      },
    });
  }

  async findAll(investigationId?: string) {
    const where = investigationId ? { investigationId } : {};
    return this.prisma.entity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { displayName: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        results: {
          orderBy: { fetchedAt: 'desc' },
        },
        findings: true,
        outRelations: {
          include: { to: true },
        },
        inRelations: {
          include: { from: true },
        },
      },
    });

    if (!entity) {
      throw new NotFoundException(`Entity ${id} not found`);
    }

    return entity;
  }
}
