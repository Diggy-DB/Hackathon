import { Module } from '@nestjs/common';
import { ScenesController } from './scenes.controller';
import { ScenesService } from './scenes.service';
import { SceneBibleService } from './scene-bible.service';

@Module({
  controllers: [ScenesController],
  providers: [ScenesService, SceneBibleService],
  exports: [ScenesService, SceneBibleService],
})
export class ScenesModule {}
