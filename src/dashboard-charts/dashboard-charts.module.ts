import { Module } from '@nestjs/common';
import { DashboardChartsService } from './dashboard-charts.service';
import { DashboardChartsController } from './dashboard-charts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardChartsController],
  providers: [DashboardChartsService],
  exports: [DashboardChartsService],
})
export class DashboardChartsModule {} 