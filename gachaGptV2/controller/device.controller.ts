import {
  Controller, Post, Body, Get, Param, Put, UseGuards
} from '@nestjs/common';
import { DeviceService } from '../service/device.service';
import { AuthGuard } from '../interface/auth.guard';

@Controller('api/devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.deviceService.registerDevice(body);
  }

  @Get('status/:hardwareId')
  async getStatus(@Param('hardwareId') hardwareId: string) {
    return this.deviceService.getDeviceStatus(hardwareId);
  }

  @UseGuards(AuthGuard)
  @Put(':deviceId/approve')
  async approve(@Param('deviceId') deviceId: string) {
    return this.deviceService.approveDevice(deviceId);
  }

  @UseGuards(AuthGuard)
  @Put(':deviceId/reject')
  async reject(@Param('deviceId') deviceId: string, @Body('reason') reason: string) {
    return this.deviceService.rejectDevice(deviceId, reason);
  }
}