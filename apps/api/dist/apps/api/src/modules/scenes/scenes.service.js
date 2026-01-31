"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenesService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const client_1 = require("@prisma/client");
let ScenesService = class ScenesService {
    prisma;
    redis;
    generationQueue;
    constructor(prisma, redis, generationQueue) {
        this.prisma = prisma;
        this.redis = redis;
        this.generationQueue = generationQueue;
    }
    async list(query) {
        const { page = 1, limit = 20, topicId, sort = 'recent' } = query;
        const skip = (page - 1) * limit;
        const where = { status: client_1.SceneStatus.PUBLISHED };
        if (topicId)
            where.topicId = topicId;
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
    async findById(id) {
        const cached = await this.redis.get(`scene:${id}`);
        if (cached)
            return cached;
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
            throw new common_1.NotFoundException('Scene not found');
        }
        await this.redis.set(`scene:${id}`, scene, 60);
        return scene;
    }
    async getPlaylist(id) {
        const scene = await this.prisma.scene.findUnique({
            where: { id },
            include: {
                segments: {
                    where: { status: client_1.SegmentStatus.COMPLETED },
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
            throw new common_1.NotFoundException('Scene not found');
        }
        return {
            sceneId: scene.id,
            totalDuration: scene.totalDuration,
            segments: scene.segments,
        };
    }
    async create(dto, userId) {
        const scene = await this.prisma.scene.create({
            data: {
                title: dto.title,
                description: dto.description,
                topicId: dto.topicId,
                createdById: userId,
                status: client_1.SceneStatus.DRAFT,
            },
        });
        await this.prisma.sceneBible.create({
            data: { sceneId: scene.id },
        });
        const segment = await this.prisma.segment.create({
            data: {
                sceneId: scene.id,
                createdById: userId,
                orderIndex: 1,
                prompt: dto.initialPrompt,
                status: client_1.SegmentStatus.PENDING,
            },
        });
        const job = await this.prisma.job.create({
            data: {
                type: client_1.JobType.GENERATE_SEGMENT,
                segmentId: segment.id,
                status: client_1.JobStatus.PENDING,
            },
        });
        await this.generationQueue.add('generate', {
            jobId: job.id,
            sceneId: scene.id,
            segmentId: segment.id,
        });
        return { scene, segment, job };
    }
    async continue(sceneId, dto, userId) {
        const scene = await this.prisma.scene.findUnique({
            where: { id: sceneId },
            include: { segments: { orderBy: { orderIndex: 'desc' }, take: 1 } },
        });
        if (!scene) {
            throw new common_1.NotFoundException('Scene not found');
        }
        const lastOrderIndex = scene.segments[0]?.orderIndex || 0;
        const segment = await this.prisma.segment.create({
            data: {
                sceneId,
                createdById: userId,
                orderIndex: lastOrderIndex + 1,
                prompt: dto.prompt,
                status: client_1.SegmentStatus.PENDING,
            },
        });
        const job = await this.prisma.job.create({
            data: {
                type: client_1.JobType.GENERATE_SEGMENT,
                segmentId: segment.id,
                status: client_1.JobStatus.PENDING,
            },
        });
        await this.generationQueue.add('generate', {
            jobId: job.id,
            sceneId,
            segmentId: segment.id,
        });
        await this.redis.del(`scene:${sceneId}`);
        return { segment, job };
    }
    getOrderBy(sort) {
        switch (sort) {
            case 'popular':
                return { upvotes: 'desc' };
            case 'trending':
                return [{ viewCount: 'desc' }, { createdAt: 'desc' }];
            case 'recent':
            default:
                return { createdAt: 'desc' };
        }
    }
};
exports.ScenesService = ScenesService;
exports.ScenesService = ScenesService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('generation')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_2.Queue])
], ScenesService);
//# sourceMappingURL=scenes.service.js.map