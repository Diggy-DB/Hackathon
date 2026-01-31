import { PrismaService } from '../../prisma/prisma.service';
import { SegmentStatus } from '@prisma/client';
export declare class SegmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        scene: {
            title: string;
            id: string;
        };
        createdBy: {
            username: string;
            id: string;
            avatarUrl: string | null;
        };
    } & {
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
    }>;
    getForScene(sceneId: string): Promise<({
        createdBy: {
            username: string;
            id: string;
            avatarUrl: string | null;
        };
    } & {
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
    })[]>;
    updateStatus(id: string, status: SegmentStatus, data?: {
        videoUrl?: string;
        hlsUrl?: string;
        thumbnailUrl?: string;
        duration?: number;
    }): Promise<{
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
    }>;
}
