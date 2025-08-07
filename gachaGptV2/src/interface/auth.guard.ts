import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 없습니다');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gacha-secret-key-2024');
      req.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }
  }
}