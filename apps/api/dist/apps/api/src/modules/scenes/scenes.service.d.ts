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
        items: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            hasMore: boolean;
        };
    }>;
    findById(id: string): Promise<any>;
    getPlaylist(id: string): Promise<{
        sceneId: any;
        totalDuration: any;
        segments: any;
    }>;
    create(dto: CreateSceneDto, userId: string): Promise<{
        scene: any;
        segment: any;
        job: any;
    }>;
    continue(sceneId: string, dto: ContinueSceneDto, userId: string): Promise<{
        segment: any;
        job: any;
    }>;
    private getOrderBy;
}
