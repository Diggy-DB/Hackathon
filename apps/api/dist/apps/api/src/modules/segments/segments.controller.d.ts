import { SegmentsService } from './segments.service';
export declare class SegmentsController {
    private readonly segmentsService;
    constructor(segmentsService: SegmentsService);
    getById(id: string): Promise<{
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
}
