import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateSceneDto, ContinueSceneDto, ListScenesQueryDto } from './dto';

@Injectable()
export class ScenesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    @InjectQueue('generation') private generationQueue: Queue,
  ) {}

  async list(query: ListScenesQueryDto) {
    const { page = 1, limit = 20, topicId, categoryId, sort = 'recent' } = query;
    const skip = (page - 1) * limit;

    const where: any = { status: 'active' };
    if (topicId) where.topicId = topicId;
    if (categoryId) where.categoryId = categoryId;

    const orderBy = this.getOrderBy(sort);

    const [items, total] = await Promise.all([
      this.prisma.scene.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          topic: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true } },
          user: { select: { id: true, username: true, avatarUrl: true } },
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
        topic: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true } },
        user: { select: { id: true, username: true, avatarUrl: true } },
        segments: {
          orderBy: { sequence: 'asc' },
          select: {
            id: true,
            sequence: true,
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
          where: { status: 'completed' },
          orderBy: { sequence: 'asc' },
          select: {
            id: true,
            sequence: true,
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
        categoryId: dto.categoryId,
        userId,
        status: 'draft',
      },
    });

    // Create initial segment
    const segment = await this.prisma.segment.create({
      data: {
        sceneId: scene.id,
        userId,
        sequence: 1,
        prompt: dto.initialPrompt,
        status: 'pending',
      },
    });

    // Create job
    const job = await this.prisma.job.create({
      data: {
        type: 'generate_segment',
        payload: {
          sceneId: scene.id,
          segmentId: segment.id,
          prompt: dto.initialPrompt,
          isInitial: true,
        },
        status: 'pending',
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
      include: { segments: { orderBy: { sequence: 'desc' }, take: 1 } },
    });

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    const lastSequence = scene.segments[0]?.sequence || 0;

    // Create new segment
    const segment = await this.prisma.segment.create({
      data: {
        sceneId,
        userId,
        parentId: dto.parentSegmentId,
        sequence: lastSequence + 1,
        prompt: dto.prompt,
        status: 'pending',
      },
    });

    // Create job
    const job = await this.prisma.job.create({
      data: {
        type: 'generate_segment',
        payload: {
          sceneId,
          segmentId: segment.id,
          parentSegmentId: dto.parentSegmentId,
          prompt: dto.prompt,
          isInitial: false,
        },
        status: 'pending',
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
        return { likeCount: 'desc' as const };
      case 'trending':
        return [{ viewCount: 'desc' as const }, { createdAt: 'desc' as const }];
      case 'recent':
      default:
        return { createdAt: 'desc' as const };
    }
  }
}
