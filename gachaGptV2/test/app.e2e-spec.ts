import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as jwt from 'jsonwebtoken';

describe('GachaGptV2 E2E Tests', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 테스트용 JWT 토큰 생성
    adminToken = jwt.sign(
      { userId: 'admin-001', role: 'admin' },
      process.env.JWT_SECRET || 'gacha-secret-key-2024',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('장치 등록 API', () => {
    it('POST /api/devices/register - 성공', () => {
      const deviceData = {
        hardwareId: 'VM999TEST001',
        tenantId: '550e8400-e29b-41d4-a716-446655440999',
        ipAddress: '192.168.1.999',
        systemInfo: {
          os: 'Ubuntu',
          version: '22.04.3 LTS',
          architecture: 'x86_64',
          memory: '8GB',
          storage: '256GB SSD'
        }
      };

      return request(app.getHttpServer())
        .post('/api/devices/register')
        .send(deviceData)
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.message).toBe('등록 요청 완료');
          expect(res.body.data.deviceId).toBeDefined();
        });
    });

    it('POST /api/devices/register - 입력값 오류', () => {
      const invalidData = {
        hardwareId: 'VM999TEST001',
        // tenantId 누락
        ipAddress: 'invalid-ip',
        systemInfo: {}
      };

      return request(app.getHttpServer())
        .post('/api/devices/register')
        .send(invalidData)
        .expect(400)
        .expect((res) => {
          expect(res.body.status).toBe('error');
          expect(res.body.message).toBe('입력값 오류');
        });
    });
  });

  describe('장치 상태 조회 API', () => {
    it('GET /api/devices/status/:hardwareId - 승인된 장치', () => {
      return request(app.getHttpServer())
        .get('/api/devices/status/VM101APPROVED01')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.message).toBe('장치 승인됨');
          expect(res.body.data.deviceId).toBeDefined();
          expect(res.body.data.sqsQueueUrl).toBeDefined();
        });
    });

    it('GET /api/devices/status/:hardwareId - 대기 중인 장치', () => {
      return request(app.getHttpServer())
        .get('/api/devices/status/VM103PENDING001')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.message).toBe('승인 대기 중');
        });
    });

    it('GET /api/devices/status/:hardwareId - 존재하지 않는 장치', () => {
      return request(app.getHttpServer())
        .get('/api/devices/status/NONEXISTENT')
        .expect(404)
        .expect((res) => {
          expect(res.body.status).toBe('error');
          expect(res.body.message).toBe('장치 없음');
        });
    });
  });

  describe('관리자 API (인증 필요)', () => {
    it('GET /api/devices/pending - 대기 중인 장치 목록', () => {
      return request(app.getHttpServer())
        .get('/api/devices/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.data).toBeInstanceOf(Array);
        });
    });

    it('PUT /api/devices/:deviceId/approve - 장치 승인', () => {
      return request(app.getHttpServer())
        .put('/api/devices/dev-test-001/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.message).toBe('장치 승인 완료');
          expect(res.body.data.sqsQueueUrl).toBeDefined();
        });
    });

    it('PUT /api/devices/:deviceId/reject - 장치 거부', () => {
      return request(app.getHttpServer())
        .put('/api/devices/dev-test-002/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: '보안 정책 위반' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.message).toBe('장치 거부 완료');
        });
    });

    it('인증 토큰 없이 관리자 API 호출 - 401 오류', () => {
      return request(app.getHttpServer())
        .get('/api/devices/pending')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('인증 토큰이 없습니다');
        });
    });
  });
});