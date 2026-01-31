import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TopicsService } from './topics.service';

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'List all topics' })
  @ApiQuery({ name: 'category', required: false })
  async list(@Query('category') category?: string) {
    return this.topicsService.list(category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all topic categories' })
  async getCategories() {
    return this.topicsService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get topic by ID' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.topicsService.findById(id);
  }
}
