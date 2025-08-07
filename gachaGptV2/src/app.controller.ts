import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): any {
    return {
      status: 'success',
      message: '🤖 GachaGptV2 NestJS 서버가 정상 실행 중입니다',
      data: {
        version: '1.0.0',
        framework: 'NestJS',
        endpoints: [
          'POST /api/devices/register',
          'GET /api/devices/status/:hardwareId',
          'GET /api/devices/pending',
          'PUT /api/devices/:deviceId/approve',
          'PUT /api/devices/:deviceId/reject'
        ]
      }
    };
  }

  @Get('health')
  getHealth(): any {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}