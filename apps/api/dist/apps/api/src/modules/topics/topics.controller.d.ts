import { TopicsService } from './topics.service';
export declare class TopicsController {
    private readonly topicsService;
    constructor(topicsService: TopicsService);
    list(category?: string): Promise<{}>;
    getCategories(): Promise<{
        items: any;
    }>;
    getById(id: string): Promise<{
        id: any;
        title: any;
        description: any;
        category: any;
        upvotes: any;
        sceneCount: any;
        createdBy: any;
        createdAt: any;
    }>;
}
