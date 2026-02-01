import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SegmentStatus } from '@prisma/client';
import { SubmitSegmentDto, GenerateVideoDto } from './dto';
export declare class SegmentsService {
    private prisma;
    private generationQueue;
    constructor(prisma: PrismaService, generationQueue: Queue);
    findById(id: string): Promise<any>;
    getForScene(sceneId: string): Promise<any>;
    submitSegment(dto: SubmitSegmentDto, userId: string): Promise<any>;
    generateVideo(dto: GenerateVideoDto, userId: string): Promise<{
        jobId: any;
        segmentId: string;
        status: string;
        message: string;
    }>;
    submitAndGenerate(dto: SubmitSegmentDto, userId: string): Promise<{
        segment: any;
        job: {
            jobId: any;
            segmentId: string;
            status: string;
            message: string;
        };
    }>;
    getJobStatus(jobId: string): Promise<{
        jobId: any;
        type: any;
        status: any;
        progress: any;
        stage: any;
        error: any;
        segment: any;
        createdAt: any;
        startedAt: any;
        completedAt: any;
    }>;
    getPreviousSegments(sceneId: string, beforeOrderIndex: number): Promise<any>;
    updateStatus(id: string, status: SegmentStatus, data?: {
        videoUrl?: string;
        hlsUrl?: string;
        thumbnailUrl?: string;
        duration?: number;
    }): Promise<any>;
}
