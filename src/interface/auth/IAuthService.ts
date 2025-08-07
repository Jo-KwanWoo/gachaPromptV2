export interface IAuthService {
  generateToken(payload: any): string;
  verifyToken(token: string): any;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}