import { ScenesService } from './scenes.service';
import { SceneBibleService } from './scene-bible.service';
import { CreateSceneDto, ContinueSceneDto, ListScenesQueryDto } from './dto';
import { JwtPayload } from '@storyforge/shared';
export declare class ScenesController {
    private readonly scenesService;
    private readonly sceneBibleService;
    constructor(scenesService: ScenesService, sceneBibleService: SceneBibleService);
    listScenes(query: ListScenesQueryDto): Promise<{
        items: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            hasMore: boolean;
        };
    }>;
    getScene(id: string): Promise<any>;
    getPlaylist(id: string): Promise<{
        sceneId: any;
        totalDuration: any;
        segments: any;
    }>;
    getBible(id: string): Promise<import("./scene-bible.service").SceneBibleData>;
    createScene(dto: CreateSceneDto, user: JwtPayload): Promise<{
        scene: any;
        segment: any;
        job: any;
    }>;
    continueScene(id: string, dto: ContinueSceneDto, user: JwtPayload): Promise<{
        segment: any;
        job: any;
    }>;
}
