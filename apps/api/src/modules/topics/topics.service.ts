import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class TopicsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async list() {
    // Try cache first
    const cached = await this.redis.get('topics:all');
    if (cached) return cached;

    const topics = await this.prisma.topic.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { scenes: true } },
      },
    });

    const result = topics.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      iconUrl: t.iconUrl,
      sceneCount: t._count.scenes,
    }));

    // Cache for 5 minutes
    await this.redis.set('topics:all', result, 300);

    return { items: result };
  }

  async findById(id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        _count: { select: { scenes: true } },
        categories: { orderBy: { name: 'asc' } },
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return {
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
      iconUrl: topic.iconUrl,
      sceneCount: topic._count.scenes,
      categories: topic.categories,
    };
  }

  async getCategories(topicId: string) {
    const categories = await this.prisma.category.findMany({
      where: { topicId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { scenes: true } },
      },
    });

    return {
      items: categories.map((c) => ({
        id: c.id,
        name: c.name,
        sceneCount: c._count.scenes,
      })),
    };
  }
}
