import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TopicsService } from './topics.service';

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'List all topics' })
  async list() {
    return this.topicsService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get topic by ID' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.topicsService.findById(id);
  }

  @Get(':id/categories')
  @ApiOperation({ summary: 'Get categories for a topic' })
  async getCategories(@Param('id', ParseUUIDPipe) id: string) {
    return this.topicsService.getCategories(id);
  }
}
