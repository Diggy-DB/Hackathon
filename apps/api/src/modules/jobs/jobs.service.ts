import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { JobStatus, Prisma } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    @InjectQueue('generation') private generationQueue: Queue,
  ) {}

  async getStatus(id: string) {
    // Try cache first for active jobs
    const cached = await this.redis.get(`job:${id}`);
    if (cached) return cached;

    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        segment: { select: { id: true, sceneId: true } },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
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

    // Cache active jobs for 30 seconds
    const isActive = job.status === JobStatus.PENDING || 
                     job.status === JobStatus.QUEUED || 
                     job.status === JobStatus.PROCESSING;
    if (isActive) {
      await this.redis.set(`job:${id}`, status, 30);
    }

    return status;
  }

  async updateProgress(id: string, progress: number, stage?: string) {
    const job = await this.prisma.job.update({
      where: { id },
      data: {
        progress,
        stage,
        status: JobStatus.PROCESSING,
        startedAt: new Date(),
      },
    });

    // Publish progress update
    await this.redis.publish('job:progress', {
      jobId: id,
      progress,
      stage,
      status: JobStatus.PROCESSING,
    });

    // Update cache
    await this.redis.set(`job:${id}`, job, 30);

    return job;
  }

  async complete(id: string, result: Prisma.InputJsonValue) {
    const job = await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.COMPLETED,
        progress: 100,
        result,
        completedAt: new Date(),
      },
    });

    // Publish completion
    await this.redis.publish('job:complete', {
      jobId: id,
      success: true,
      result,
    });

    // Remove from cache
    await this.redis.del(`job:${id}`);

    return job;
  }

  async fail(id: string, error: string) {
    const job = await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.FAILED,
        error,
        completedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    // Publish failure
    await this.redis.publish('job:complete', {
      jobId: id,
      success: false,
      error,
    });

    // Remove from cache
    await this.redis.del(`job:${id}`);

    return job;
  }

  async retry(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { segment: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== JobStatus.FAILED) {
      throw new BadRequestException('Only failed jobs can be retried');
    }

    if (job.attempts >= job.maxAttempts) {
      throw new BadRequestException('Maximum retry attempts exceeded');
    }

    // Reset job
    await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.PENDING,
        progress: 0,
        stage: null,
        error: null,
        startedAt: null,
        completedAt: null,
      },
    });

    // Re-queue
    await this.generationQueue.add('generate', {
      jobId: job.id,
      segmentId: job.segmentId,
      sceneId: job.segment?.sceneId,
    });

    return { success: true };
  }

  async cancel(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const isCancelable = job.status === JobStatus.PENDING || job.status === JobStatus.QUEUED;
    if (!isCancelable) {
      throw new BadRequestException('Only pending jobs can be cancelled');
    }

    await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    return { success: true };
  }
}
