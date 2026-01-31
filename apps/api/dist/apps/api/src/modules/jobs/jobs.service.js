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
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const client_1 = require("@prisma/client");
let JobsService = class JobsService {
    prisma;
    redis;
    generationQueue;
    constructor(prisma, redis, generationQueue) {
        this.prisma = prisma;
        this.redis = redis;
        this.generationQueue = generationQueue;
    }
    async getStatus(id) {
        const cached = await this.redis.get(`job:${id}`);
        if (cached)
            return cached;
        const job = await this.prisma.job.findUnique({
            where: { id },
            include: {
                segment: { select: { id: true, sceneId: true } },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        const status = {
            id: job.id,
            type: job.type,
            status: job.status,
            progress: job.progress,
            stage: job.stage,
            error: job.error,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            segment: job.segment,
        };
        const isActive = job.status === client_1.JobStatus.PENDING ||
            job.status === client_1.JobStatus.QUEUED ||
            job.status === client_1.JobStatus.PROCESSING;
        if (isActive) {
            await this.redis.set(`job:${id}`, status, 30);
        }
        return status;
    }
    async updateProgress(id, progress, stage) {
        const job = await this.prisma.job.update({
            where: { id },
            data: {
                progress,
                stage,
                status: client_1.JobStatus.PROCESSING,
                startedAt: new Date(),
            },
        });
        await this.redis.publish('job:progress', {
            jobId: id,
            progress,
            stage,
            status: client_1.JobStatus.PROCESSING,
        });
        await this.redis.set(`job:${id}`, job, 30);
        return job;
    }
    async complete(id, result) {
        const job = await this.prisma.job.update({
            where: { id },
            data: {
                status: client_1.JobStatus.COMPLETED,
                progress: 100,
                result,
                completedAt: new Date(),
            },
        });
        await this.redis.publish('job:complete', {
            jobId: id,
            success: true,
            result,
        });
        await this.redis.del(`job:${id}`);
        return job;
    }
    async fail(id, error) {
        const job = await this.prisma.job.update({
            where: { id },
            data: {
                status: client_1.JobStatus.FAILED,
                error,
                completedAt: new Date(),
                attempts: { increment: 1 },
            },
        });
        await this.redis.publish('job:complete', {
            jobId: id,
            success: false,
            error,
        });
        await this.redis.del(`job:${id}`);
        return job;
    }
    async retry(id) {
        const job = await this.prisma.job.findUnique({
            where: { id },
            include: { segment: true },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        if (job.status !== client_1.JobStatus.FAILED) {
            throw new common_1.BadRequestException('Only failed jobs can be retried');
        }
        if (job.attempts >= job.maxAttempts) {
            throw new common_1.BadRequestException('Maximum retry attempts exceeded');
        }
        await this.prisma.job.update({
            where: { id },
            data: {
                status: client_1.JobStatus.PENDING,
                progress: 0,
                stage: null,
                error: null,
                startedAt: null,
                completedAt: null,
            },
        });
        await this.generationQueue.add('generate', {
            jobId: job.id,
            segmentId: job.segmentId,
            sceneId: job.segment?.sceneId,
        });
        return { success: true };
    }
    async cancel(id) {
        const job = await this.prisma.job.findUnique({
            where: { id },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        const isCancelable = job.status === client_1.JobStatus.PENDING || job.status === client_1.JobStatus.QUEUED;
        if (!isCancelable) {
            throw new common_1.BadRequestException('Only pending jobs can be cancelled');
        }
        await this.prisma.job.update({
            where: { id },
            data: {
                status: client_1.JobStatus.CANCELLED,
                completedAt: new Date(),
            },
        });
        return { success: true };
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('generation')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_2.Queue])
], JobsService);
//# sourceMappingURL=jobs.service.js.map