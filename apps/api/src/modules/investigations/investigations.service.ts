import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvestigationDto, SessionUser } from '@osint/types';

@Injectable()
export class InvestigationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInvestigationDto, user: SessionUser) {
    return this.prisma.investigation.create({
      data: {
        title: dto.title,
        description: dto.description,
        tags: dto.tags || [],
        ownerId: user.id,
      },
    });
  }

  async findAll(user: SessionUser) {
    // Basic RBAC logic: Viewers see all, or maybe we scope it by team?
    // For now, analysts see their own, admins see all.
    const where = user.role === 'ADMIN' ? {} : { ownerId: user.id };
    
    return this.prisma.investigation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { displayName: true } },
        _count: { select: { entities: true, evidence: true, alerts: true } }
      },
    });
  }

  async findOne(id: string, user: SessionUser) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id },
      include: {
        owner: { select: { displayName: true } },
        entities: { orderBy: { createdAt: 'desc' } },
        evidence: true,
        alerts: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!investigation) {
      throw new NotFoundException(`Investigation ${id} not found`);
    }

    if (user.role !== 'ADMIN' && investigation.ownerId !== user.id) {
      throw new ForbiddenException('Access denied to this investigation');
    }

    return investigation;
  }
}
