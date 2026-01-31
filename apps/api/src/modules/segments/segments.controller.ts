import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SegmentsService } from './segments.service';

@ApiTags('segments')
@Controller('segments')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get segment by ID' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.segmentsService.findById(id);
  }
}
