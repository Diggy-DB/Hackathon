import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SegmentsService } from './segments.service';
import {
  SubmitSegmentDto,
  GenerateVideoDto,
  SegmentResponseDto,
  JobStatusDto,
} from './dto';

@ApiTags('segments')
@Controller('segments')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get segment by ID' })
  @ApiResponse({ status: 200, description: 'Segment found', type: SegmentResponseDto })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async getById(@Param('id') id: string) {
    return this.segmentsService.findById(id);
  }

  @Get('scene/:sceneId')
  @ApiOperation({ summary: 'Get all segments for a scene' })
  @ApiResponse({ status: 200, description: 'List of segments', type: [SegmentResponseDto] })
  async getForScene(@Param('sceneId') sceneId: string) {
    return this.segmentsService.getForScene(sceneId);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a new segment prompt',
    description:
      'Creates a new segment with the user-provided story prompt. The segment is created in PENDING status.',
  })
  @ApiResponse({ status: 201, description: 'Segment created', type: SegmentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate order index' })
  @ApiResponse({ status: 404, description: 'Scene not found' })
  async submitSegment(@Body() dto: SubmitSegmentDto, @Request() req: any) {
    return this.segmentsService.submitSegment(dto, req.user.sub);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Start video generation for a segment',
    description:
      'Queues a segment for video generation. The prompt is expanded using ChatGPT and then video is generated using Google Veo 3.',
  })
  @ApiResponse({ status: 201, description: 'Generation job created', type: JobStatusDto })
  @ApiResponse({ status: 400, description: 'Generation already in progress' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async generateVideo(@Body() dto: GenerateVideoDto, @Request() req: any) {
    return this.segmentsService.generateVideo(dto, req.user.sub);
  }

  @Post('submit-and-generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a segment and immediately start video generation',
    description:
      'Combines segment creation and video generation into a single call. Creates the segment, queues it for processing with ChatGPT script expansion, then generates video with Google Veo 3.',
  })
  @ApiResponse({
    status: 201,
    description: 'Segment created and generation queued',
    schema: {
      type: 'object',
      properties: {
        segment: { $ref: '#/components/schemas/SegmentResponseDto' },
        job: { $ref: '#/components/schemas/JobStatusDto' },
      },
    },
  })
  async submitAndGenerate(@Body() dto: SubmitSegmentDto, @Request() req: any) {
    return this.segmentsService.submitAndGenerate(dto, req.user.sub);
  }

  @Get('job/:jobId/status')
  @ApiOperation({ summary: 'Get video generation job status' })
  @ApiResponse({ status: 200, description: 'Job status', type: JobStatusDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.segmentsService.getJobStatus(jobId);
  }
}
