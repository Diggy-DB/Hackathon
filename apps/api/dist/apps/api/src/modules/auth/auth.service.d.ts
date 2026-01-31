import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LoginDto, SignupDto } from './dto';
export declare class AuthService {
    private prisma;
    private jwt;
    private redis;
    constructor(prisma: PrismaService, jwt: JwtService, redis: RedisService);
    signup(dto: SignupDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    }>;
    logout(userId: string): Promise<{
        success: boolean;
    }>;
    getUser(userId: string): Promise<{
        email: string;
        username: string;
        id: string;
        displayName: string | null;
        avatarUrl: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
    }>;
    private generateTokens;
    private hashPassword;
    private verifyPassword;
}
