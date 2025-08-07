import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DeviceController } from './controller/device.controller';
import { DeviceService } from './service/device.service';
import { DeviceRepository } from './interface/dynamo.repository';
import { SqsService } from './interface/sqs.service';
import { DeviceValidator } from './domain/device.validator';
import { AuthGuard } from './interface/auth.guard';

@Module({
  imports: [],
  controllers: [AppController, DeviceController],
  providers: [
    DeviceService,
    DeviceRepository,
    SqsService,
    DeviceValidator,
    AuthGuard,
  ],
})
export class AppModule {}