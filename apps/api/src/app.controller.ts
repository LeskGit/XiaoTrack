import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RegisterDto } from './auth/dto/register.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/db')
  async dbHealth() {
    const users = await this.prisma.user.count();
    return { status: 'ok', users };
  }

  @Post('debug/validate')
  debugValidate(@Body() dto: RegisterDto) {
    return dto;
  }
}
