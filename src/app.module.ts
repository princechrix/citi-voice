import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersService } from './users/users.service';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/users.controller';
import { AuthModule } from './auth/auth.module';
import { MailService } from './mail/mail.service';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { AgencyService } from './agency/agency.service';
import { AgencyModule } from './agency/agency.module';
import { CloudinaryService } from './file/file.service';
import { FileModule } from './file/file.module';
import { CategoryModule } from './category/category.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { ComplaintHistoryModule } from './complaint-history/complaint-history.module';
import { DashboardChartsModule } from './dashboard-charts/dashboard-charts.module';
@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }), 
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
    }), AgencyModule, FileModule, CategoryModule, ComplaintsModule, ComplaintHistoryModule, DashboardChartsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, MailService, AgencyService, CloudinaryService],
})
export class AppModule {}
