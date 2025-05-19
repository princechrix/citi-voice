import { Module } from '@nestjs/common';
import { ComplaintHistoryService } from './complaint-history.service';
import { ComplaintHistoryController } from './complaint-history.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ComplaintHistoryController],
  providers: [ComplaintHistoryService],
})
export class ComplaintHistoryModule {}
