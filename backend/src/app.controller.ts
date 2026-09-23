import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('healthy')
  getHealthy() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'TodoMobile Backend API',
    };
  }
}
