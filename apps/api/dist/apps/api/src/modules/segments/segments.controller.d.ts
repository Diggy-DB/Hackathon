import { SegmentsService } from './segments.service';
import { SubmitSegmentDto, GenerateVideoDto } from './dto';
export declare class SegmentsController {
    private readonly segmentsService;
    constructor(segmentsService: SegmentsService);
    getById(id: string): Promise<any>;
    getForScene(sceneId: string): Promise<any>;
    submitSegment(dto: SubmitSegmentDto, req: any): Promise<any>;
    generateVideo(dto: GenerateVideoDto, req: any): Promise<{
        jobId: any;
        segmentId: string;
        status: string;
        message: string;
    }>;
    submitAndGenerate(dto: SubmitSegmentDto, req: any): Promise<{
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
}
