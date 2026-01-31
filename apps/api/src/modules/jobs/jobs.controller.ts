import { Controller, Get, Post, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get job status' })
  async getStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.getStatus(id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  async retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.retry(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending job' })
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.cancel(id);
  }
}
