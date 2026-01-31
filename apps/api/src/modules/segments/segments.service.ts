import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SegmentsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const segment = await this.prisma.segment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        scene: { select: { id: true, title: true } },
      },
    });

    if (!segment) {
      throw new NotFoundException('Segment not found');
    }

    return segment;
  }

  async getForScene(sceneId: string) {
    return this.prisma.segment.findMany({
      where: { sceneId },
      orderBy: { sequence: 'asc' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    data?: { videoUrl?: string; hlsUrl?: string; thumbnailUrl?: string; duration?: number },
  ) {
    return this.prisma.segment.update({
      where: { id },
      data: {
        status,
        ...data,
      },
    });
  }
}
