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
            role: UserRole;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        user: {
            id: string;
            email: string;
            role: UserRole;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        user: {
            id: string;
            email: string;
            role: UserRole;
        };
    }>;
    logout(userId: string): Promise<{
        success: boolean;
    }>;
    getUser(userId: string): Promise<any>;
    private generateTokens;
    private hashPassword;
    private verifyPassword;
}
