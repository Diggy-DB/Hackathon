import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SceneBible } from '@storyforge/shared';

@Injectable()
export class SceneBibleService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getForScene(sceneId: string): Promise<SceneBible> {
    // Try cache first
    const cached = await this.redis.get<SceneBible>(`bible:${sceneId}`);
    if (cached) return cached;

    const bible = await this.prisma.sceneBible.findUnique({
      where: { sceneId },
    });

    if (!bible) {
      // Return empty bible for new scenes
      return this.createEmptyBible(sceneId);
    }

    const data = bible.data as unknown as SceneBible;

    // Cache for 5 minutes
    await this.redis.set(`bible:${sceneId}`, data, 300);

    return data;
  }

  async update(sceneId: string, bible: SceneBible): Promise<SceneBible> {
    const updated = await this.prisma.sceneBible.upsert({
      where: { sceneId },
      create: {
        sceneId,
        version: 1,
        data: bible as any,
      },
      update: {
        version: { increment: 1 },
        data: bible as any,
      },
    });

    // Invalidate cache
    await this.redis.del(`bible:${sceneId}`);

    return updated.data as unknown as SceneBible;
  }

  async addCharacter(
    sceneId: string,
    character: SceneBible['characters'][string],
  ): Promise<SceneBible> {
    const bible = await this.getForScene(sceneId);
    bible.characters[character.entityId] = character;
    bible.metadata.updatedAt = new Date().toISOString();
    return this.update(sceneId, bible);
  }

  async addLocation(
    sceneId: string,
    location: SceneBible['locations'][string],
  ): Promise<SceneBible> {
    const bible = await this.getForScene(sceneId);
    bible.locations[location.entityId] = location;
    bible.metadata.updatedAt = new Date().toISOString();
    return this.update(sceneId, bible);
  }

  async addTimelineEvent(
    sceneId: string,
    event: SceneBible['timeline'][number],
  ): Promise<SceneBible> {
    const bible = await this.getForScene(sceneId);
    bible.timeline.push(event);
    bible.metadata.updatedAt = new Date().toISOString();
    bible.metadata.segmentCount = bible.timeline.length;
    return this.update(sceneId, bible);
  }

  private createEmptyBible(sceneId: string): SceneBible {
    return {
      sceneId,
      version: 0,
      characters: {},
      locations: {},
      objects: {},
      timeline: [],
      relationships: [],
      rules: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        segmentCount: 0,
        lastSegmentId: '',
      },
    };
  }
}
