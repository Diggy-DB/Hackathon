import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateSceneDto, ContinueSceneDto, ListScenesQueryDto } from './dto';
export declare class ScenesService {
    private prisma;
    private redis;
    private generationQueue;
    constructor(prisma: PrismaService, redis: RedisService, generationQueue: Queue);
    list(query: ListScenesQueryDto): Promise<{
        items: ({
            topic: {
                title: string;
                id: string;
            } | null;
            createdBy: {
                username: string;
                id: string;
                avatarUrl: string | null;
            };
        } & {
            description: string | null;
            title: string;
            id: string;
            status: import("@prisma/client").$Enums.SceneStatus;
            createdAt: Date;
            updatedAt: Date;
            topicId: string | null;
            upvotes: number;
            createdById: string;
            viewCount: number;
            thumbnailUrl: string | null;
            segmentCount: number;
            totalDuration: number;
            publishedAt: Date | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
    }>;
    findById(id: string): Promise<{}>;
    getPlaylist(id: string): Promise<{
        sceneId: string;
        totalDuration: number;
        segments: {
            id: string;
            thumbnailUrl: string | null;
            orderIndex: number;
            hlsUrl: string | null;
            duration: number | null;
        }[];
    }>;
    create(dto: CreateSceneDto, userId: string): Promise<{
        scene: {
            description: string | null;
            title: string;
            id: string;
            status: import("@prisma/client").$Enums.SceneStatus;
            createdAt: Date;
            updatedAt: Date;
            topicId: string | null;
            upvotes: number;
            createdById: string;
            viewCount: number;
            thumbnailUrl: string | null;
            segmentCount: number;
            totalDuration: number;
            publishedAt: Date | null;
        };
        segment: {
            id: string;
            status: import("@prisma/client").$Enums.SegmentStatus;
            createdAt: Date;
            updatedAt: Date;
            prompt: string;
            createdById: string;
            thumbnailUrl: string | null;
            orderIndex: number;
            sceneId: string;
            expandedScript: string | null;
            videoUrl: string | null;
            hlsUrl: string | null;
            duration: number | null;
            continuityHash: string | null;
            completedAt: Date | null;
        };
        job: {
            error: string | null;
            type: import("@prisma/client").$Enums.JobType;
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            createdAt: Date;
            updatedAt: Date;
            result: import("@prisma/client/runtime/library").JsonValue | null;
            completedAt: Date | null;
            priority: number;
            progress: number;
            stage: string | null;
            attempts: number;
            maxAttempts: number;
            startedAt: Date | null;
            segmentId: string | null;
        };
    }>;
    continue(sceneId: string, dto: ContinueSceneDto, userId: string): Promise<{
        segment: {
            id: string;
            status: import("@prisma/client").$Enums.SegmentStatus;
            createdAt: Date;
            updatedAt: Date;
            prompt: string;
            createdById: string;
            thumbnailUrl: string | null;
            orderIndex: number;
            sceneId: string;
            expandedScript: string | null;
            videoUrl: string | null;
            hlsUrl: string | null;
            duration: number | null;
            continuityHash: string | null;
            completedAt: Date | null;
        };
        job: {
            error: string | null;
            type: import("@prisma/client").$Enums.JobType;
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            createdAt: Date;
            updatedAt: Date;
            result: import("@prisma/client/runtime/library").JsonValue | null;
            completedAt: Date | null;
            priority: number;
            progress: number;
            stage: string | null;
            attempts: number;
            maxAttempts: number;
            startedAt: Date | null;
            segmentId: string | null;
        };
    }>;
    private getOrderBy;
}
