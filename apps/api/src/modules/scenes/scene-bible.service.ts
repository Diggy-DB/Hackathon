import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';

// Types for Scene Bible JSON data
interface Character {
  id: string;
  name: string;
  description?: string;
  physicalDescription?: {
    build?: string;
    hairColor?: string;
    eyeColor?: string;
  };
  referenceFrames?: string[];
  status: 'alive' | 'deceased' | 'unknown';
}

interface Location {
  id: string;
  name: string;
  description?: string;
  features?: string[];
}

interface TimelineEvent {
  segmentIndex: number;
  description: string;
  timestamp?: string;
}

export interface SceneBibleData {
  characters: Record<string, Character>;
  locations: Record<string, Location>;
  objects: Record<string, { id: string; name: string; currentOwner?: string }>;
  timeline: TimelineEvent[];
  rules: { id: string; rule: string; type: 'hard' | 'soft' }[];
}

@Injectable()
export class SceneBibleService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getForScene(sceneId: string): Promise<SceneBibleData> {
    // Try cache first
    const cached = await this.redis.get(`bible:${sceneId}`);
    if (cached) return cached as SceneBibleData;

    const bible = await this.prisma.sceneBible.findUnique({
      where: { sceneId },
    });

    if (!bible) {
      return this.createEmptyBible();
    }

    const data: SceneBibleData = {
      characters: (bible.characters as unknown) as Record<string, Character>,
      locations: (bible.locations as unknown) as Record<string, Location>,
      objects: (bible.objects as unknown) as Record<string, { id: string; name: string; currentOwner?: string }>,
      timeline: (bible.timeline as unknown) as TimelineEvent[],
      rules: (bible.rules as unknown) as { id: string; rule: string; type: 'hard' | 'soft' }[],
    };

    // Cache for 5 minutes
    await this.redis.set(`bible:${sceneId}`, data, 300);

    return data;
  }

  async update(sceneId: string, updates: Partial<SceneBibleData>): Promise<SceneBibleData> {
    const updateData: Prisma.SceneBibleUpdateInput = {
      version: { increment: 1 },
    };

    if (updates.characters) updateData.characters = updates.characters as unknown as Prisma.InputJsonValue;
    if (updates.locations) updateData.locations = updates.locations as unknown as Prisma.InputJsonValue;
    if (updates.objects) updateData.objects = updates.objects as unknown as Prisma.InputJsonValue;
    if (updates.timeline) updateData.timeline = updates.timeline as unknown as Prisma.InputJsonValue;
    if (updates.rules) updateData.rules = updates.rules as unknown as Prisma.InputJsonValue;

    await this.prisma.sceneBible.upsert({
      where: { sceneId },
      create: {
        sceneId,
        characters: (updates.characters || {}) as unknown as Prisma.InputJsonValue,
        locations: (updates.locations || {}) as unknown as Prisma.InputJsonValue,
        objects: (updates.objects || {}) as unknown as Prisma.InputJsonValue,
        timeline: (updates.timeline || []) as unknown as Prisma.InputJsonValue,
        rules: (updates.rules || {}) as unknown as Prisma.InputJsonValue,
      },
      update: updateData,
    });

    // Invalidate cache
    await this.redis.del(`bible:${sceneId}`);

    return this.getForScene(sceneId);
  }

  async addCharacter(sceneId: string, character: Character): Promise<SceneBibleData> {
    const bible = await this.getForScene(sceneId);
    bible.characters[character.id] = character;
    return this.update(sceneId, { characters: bible.characters });
  }

  async addLocation(sceneId: string, location: Location): Promise<SceneBibleData> {
    const bible = await this.getForScene(sceneId);
    bible.locations[location.id] = location;
    return this.update(sceneId, { locations: bible.locations });
  }

  async addTimelineEvent(sceneId: string, event: TimelineEvent): Promise<SceneBibleData> {
    const bible = await this.getForScene(sceneId);
    bible.timeline.push(event);
    return this.update(sceneId, { timeline: bible.timeline });
  }

  private createEmptyBible(): SceneBibleData {
    return {
      characters: {},
      locations: {},
      objects: {},
      timeline: [],
      rules: [],
    };
  }
}
