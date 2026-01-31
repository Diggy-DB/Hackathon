import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateSceneDto, ContinueSceneDto, ListScenesQueryDto } from './dto';
import { SceneStatus, SegmentStatus, JobType, JobStatus } from '@prisma/client';

@Injectable()
export class ScenesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    @InjectQueue('generation') private generationQueue: Queue,
  ) {}

  async list(query: ListScenesQueryDto) {
    const { page = 1, limit = 20, topicId, sort = 'recent' } = query;
    const skip = (page - 1) * limit;

    const where: any = { status: SceneStatus.PUBLISHED };
    if (topicId) where.topicId = topicId;

    const orderBy = this.getOrderBy(sort);

    const [items, total] = await Promise.all([
      this.prisma.scene.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          topic: { select: { id: true, title: true } },
          createdBy: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),
      this.prisma.scene.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        hasMore: skip + items.length < total,
      },
    };
  }

  async findById(id: string) {
    // Try cache first
    const cached = await this.redis.get(`scene:${id}`);
    if (cached) return cached;

    const scene = await this.prisma.scene.findUnique({
      where: { id },
      include: {
        topic: { select: { id: true, title: true } },
        createdBy: { select: { id: true, username: true, avatarUrl: true } },
        segments: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            orderIndex: true,
            thumbnailUrl: true,
            duration: true,
            status: true,
          },
        },
      },
    });

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    // Cache for 1 minute
    await this.redis.set(`scene:${id}`, scene, 60);

    return scene;
  }

  async getPlaylist(id: string) {
    const scene = await this.prisma.scene.findUnique({
      where: { id },
      include: {
        segments: {
          where: { status: SegmentStatus.COMPLETED },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            orderIndex: true,
            hlsUrl: true,
            duration: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    return {
      sceneId: scene.id,
      totalDuration: scene.totalDuration,
      segments: scene.segments,
    };
  }

  async create(dto: CreateSceneDto, userId: string) {
    // Create scene
    const scene = await this.prisma.scene.create({
      data: {
        title: dto.title,
        description: dto.description,
        topicId: dto.topicId,
        createdById: userId,
        status: SceneStatus.DRAFT,
      },
    });

    // Create initial Scene Bible
    await this.prisma.sceneBible.create({
      data: { sceneId: scene.id },
    });

    // Create initial segment
    const segment = await this.prisma.segment.create({
      data: {
        sceneId: scene.id,
        createdById: userId,
        orderIndex: 1,
        prompt: dto.initialPrompt,
        status: SegmentStatus.PENDING,
      },
    });

    // Create job
    const job = await this.prisma.job.create({
      data: {
        type: JobType.GENERATE_SEGMENT,
        segmentId: segment.id,
        status: JobStatus.PENDING,
      },
    });

    // Queue job
    await this.generationQueue.add('generate', {
      jobId: job.id,
      sceneId: scene.id,
      segmentId: segment.id,
    });

    return { scene, segment, job };
  }

  async continue(sceneId: string, dto: ContinueSceneDto, userId: string) {
    const scene = await this.prisma.scene.findUnique({
      where: { id: sceneId },
      include: { segments: { orderBy: { orderIndex: 'desc' }, take: 1 } },
    });

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    const lastOrderIndex = scene.segments[0]?.orderIndex || 0;

    // Create new segment
    const segment = await this.prisma.segment.create({
      data: {
        sceneId,
        createdById: userId,
        orderIndex: lastOrderIndex + 1,
        prompt: dto.prompt,
        status: SegmentStatus.PENDING,
      },
    });

    // Create job
    const job = await this.prisma.job.create({
      data: {
        type: JobType.GENERATE_SEGMENT,
        segmentId: segment.id,
        status: JobStatus.PENDING,
      },
    });

    // Queue job
    await this.generationQueue.add('generate', {
      jobId: job.id,
      sceneId,
      segmentId: segment.id,
    });

    // Invalidate cache
    await this.redis.del(`scene:${sceneId}`);

    return { segment, job };
  }

  private getOrderBy(sort: string) {
    switch (sort) {
      case 'popular':
        return { upvotes: 'desc' as const };
      case 'trending':
        return [{ viewCount: 'desc' as const }, { createdAt: 'desc' as const }];
      case 'recent':
      default:
        return { createdAt: 'desc' as const };
    }
  }
}
