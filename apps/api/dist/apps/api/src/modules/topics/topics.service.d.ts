import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
export declare class TopicsService {
    private prisma;
    private redis;
    constructor(prisma: PrismaService, redis: RedisService);
    list(category?: string): Promise<{}>;
    findById(id: string): Promise<{
        id: any;
        title: any;
        description: any;
        category: any;
        upvotes: any;
        sceneCount: any;
        createdBy: any;
        createdAt: any;
    }>;
    getCategories(): Promise<{
        items: any;
    }>;
}
