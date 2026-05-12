import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GraphService {
  constructor(private readonly prisma: PrismaService) {}

  async saveState(investigationId: string, data: any) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    return this.prisma.graphState.upsert({
      where: { investigationId },
      update: { data },
      create: {
        investigationId,
        data,
      },
    });
  }

  async getState(investigationId: string) {
    const state = await this.prisma.graphState.findUnique({
      where: { investigationId },
    });

    if (!state) {
      return { nodes: [], zoom: 1, pan: { x: 0, y: 0 } };
    }

    return state.data;
  }
}
