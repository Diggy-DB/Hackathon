import { TopicsService } from './topics.service';
export declare class TopicsController {
    private readonly topicsService;
    constructor(topicsService: TopicsService);
    list(category?: string): Promise<{}>;
    getCategories(): Promise<{
        items: {
            name: string;
            topicCount: number;
        }[];
    }>;
    getById(id: string): Promise<{
        id: string;
        title: string;
        description: string | null;
        category: string;
        upvotes: number;
        sceneCount: number;
        createdBy: {
            username: string;
            id: string;
            avatarUrl: string | null;
        };
        createdAt: Date;
    }>;
}
