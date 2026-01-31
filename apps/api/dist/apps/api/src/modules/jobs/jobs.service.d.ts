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
    updateProgress(id: string, progress: number, stage?: string): Promise<{
        error: string | null;
        type: import("@prisma/client").$Enums.JobType;
        id: string;
        status: import("@prisma/client").$Enums.JobStatus;
        createdAt: Date;
        updatedAt: Date;
        result: Prisma.JsonValue | null;
        completedAt: Date | null;
        priority: number;
        progress: number;
        stage: string | null;
        attempts: number;
        maxAttempts: number;
        startedAt: Date | null;
        segmentId: string | null;
    }>;
    complete(id: string, result: Prisma.InputJsonValue): Promise<{
        error: string | null;
        type: import("@prisma/client").$Enums.JobType;
        id: string;
        status: import("@prisma/client").$Enums.JobStatus;
        createdAt: Date;
        updatedAt: Date;
        result: Prisma.JsonValue | null;
        completedAt: Date | null;
        priority: number;
        progress: number;
        stage: string | null;
        attempts: number;
        maxAttempts: number;
        startedAt: Date | null;
        segmentId: string | null;
    }>;
    fail(id: string, error: string): Promise<{
        error: string | null;
        type: import("@prisma/client").$Enums.JobType;
        id: string;
        status: import("@prisma/client").$Enums.JobStatus;
        createdAt: Date;
        updatedAt: Date;
        result: Prisma.JsonValue | null;
        completedAt: Date | null;
        priority: number;
        progress: number;
        stage: string | null;
        attempts: number;
        maxAttempts: number;
        startedAt: Date | null;
        segmentId: string | null;
    }>;
    retry(id: string): Promise<{
        success: boolean;
    }>;
    cancel(id: string): Promise<{
        success: boolean;
    }>;
}
