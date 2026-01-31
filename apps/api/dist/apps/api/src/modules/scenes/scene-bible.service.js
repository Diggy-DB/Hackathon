"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneBibleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let SceneBibleService = class SceneBibleService {
    prisma;
    redis;
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async getForScene(sceneId) {
        const cached = await this.redis.get(`bible:${sceneId}`);
        if (cached)
            return cached;
        const bible = await this.prisma.sceneBible.findUnique({
            where: { sceneId },
        });
        if (!bible) {
            return this.createEmptyBible();
        }
        const data = {
            characters: bible.characters,
            locations: bible.locations,
            objects: bible.objects,
            timeline: bible.timeline,
            rules: bible.rules,
        };
        await this.redis.set(`bible:${sceneId}`, data, 300);
        return data;
    }
    async update(sceneId, updates) {
        const updateData = {
            version: { increment: 1 },
        };
        if (updates.characters)
            updateData.characters = updates.characters;
        if (updates.locations)
            updateData.locations = updates.locations;
        if (updates.objects)
            updateData.objects = updates.objects;
        if (updates.timeline)
            updateData.timeline = updates.timeline;
        if (updates.rules)
            updateData.rules = updates.rules;
        await this.prisma.sceneBible.upsert({
            where: { sceneId },
            create: {
                sceneId,
                characters: (updates.characters || {}),
                locations: (updates.locations || {}),
                objects: (updates.objects || {}),
                timeline: (updates.timeline || []),
                rules: (updates.rules || {}),
            },
            update: updateData,
        });
        await this.redis.del(`bible:${sceneId}`);
        return this.getForScene(sceneId);
    }
    async addCharacter(sceneId, character) {
        const bible = await this.getForScene(sceneId);
        bible.characters[character.id] = character;
        return this.update(sceneId, { characters: bible.characters });
    }
    async addLocation(sceneId, location) {
        const bible = await this.getForScene(sceneId);
        bible.locations[location.id] = location;
        return this.update(sceneId, { locations: bible.locations });
    }
    async addTimelineEvent(sceneId, event) {
        const bible = await this.getForScene(sceneId);
        bible.timeline.push(event);
        return this.update(sceneId, { timeline: bible.timeline });
    }
    createEmptyBible() {
        return {
            characters: {},
            locations: {},
            objects: {},
            timeline: [],
            rules: [],
        };
    }
};
exports.SceneBibleService = SceneBibleService;
exports.SceneBibleService = SceneBibleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], SceneBibleService);
//# sourceMappingURL=scene-bible.service.js.map