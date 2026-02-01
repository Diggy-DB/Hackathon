import { AuthService } from './auth.service';
import { LoginDto, SignupDto, RefreshTokenDto } from './dto';
import { JwtPayload } from '@storyforge/shared';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        user: {
            id: string;
            email: string;
            role: UserRole;
        };
    }>;
    logout(user: JwtPayload): Promise<{
        success: boolean;
    }>;
    getMe(user: JwtPayload): Promise<any>;
}
