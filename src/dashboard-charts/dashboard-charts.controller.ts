import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { DashboardChartsService } from './dashboard-charts.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';


import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard-Charts')
@Controller('dashboard-charts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardChartsController {
  constructor(private readonly dashboardChartsService: DashboardChartsService) {}

  @Get('super-admin')
  @ApiOperation({ summary: 'Get super admin analytics data' })
  @ApiResponse({
    status: 200,
    description: 'Returns analytics data for super admin dashboard',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only super admin can access this endpoint',
  })
  getSuperAdminAnalytics() {
    return this.dashboardChartsService.getSuperAdminAnalytics();
  }

  @Get('agency-admin/:agencyId')
  @ApiOperation({ summary: 'Get agency admin analytics data' })
  @ApiResponse({
    status: 200,
    description: 'Returns analytics data for agency admin dashboard',
  })
  @ApiResponse({ 
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only agency admin can access this endpoint',
  })
  getAgencyAdminAnalytics(@Param('agencyId') agencyId: string) {
    return this.dashboardChartsService.getAgencyAdminAnalytics(agencyId);
  }

  @Get('staff/:staffId')
  @ApiOperation({ summary: 'Get staff analytics data' })
  @ApiResponse({
    status: 200,
    description: 'Returns analytics data for staff dashboard',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only staff can access this endpoint',
  })
  getStaffAnalytics(@Param('staffId') staffId: string) {
    return this.dashboardChartsService.getStaffAnalytics(staffId);
  }
} 