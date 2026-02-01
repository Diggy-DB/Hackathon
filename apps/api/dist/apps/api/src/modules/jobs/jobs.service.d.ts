import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
export declare class JobsService {
    private prisma;
    private redis;
    private generationQueue;
    constructor(prisma: PrismaService, redis: RedisService, generationQueue: Queue);
    getStatus(id: string): Promise<{}>;
    updateProgress(id: string, progress: number, stage?: string): Promise<any>;
    complete(id: string, result: Prisma.InputJsonValue): Promise<any>;
    fail(id: string, error: string): Promise<any>;
    retry(id: string): Promise<{
        success: boolean;
    }>;
    cancel(id: string): Promise<{
        success: boolean;
    }>;
}
