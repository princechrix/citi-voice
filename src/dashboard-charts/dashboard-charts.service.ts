import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ComplaintStatus, Prisma, Role } from '@prisma/client';

@Injectable()
export class DashboardChartsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSuperAdminAnalytics() {
    // Get complaint status counts
    const statusCounts = await this.prisma.complaint.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get top agencies by complaint count
    const topAgencies = await this.prisma.complaint.groupBy({
      by: ['agencyId'],
      _count: {
        agencyId: true,
      },
      orderBy: {
        _count: {
          agencyId: 'desc',
        },
      },
      take: 5,
    });

    // Get resolution time by agency (average days to resolve)
    const resolutionTime = await this.prisma.complaint.findMany({
      select: {
        agencyId: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        status: ComplaintStatus.RESOLVED,
      },
      orderBy: {
        agencyId: 'asc',
      },
    });

    // Group and calculate averages manually
    const agencyResolutionTimes = resolutionTime.reduce((acc, curr) => {
      if (!acc[curr.agencyId]) {
        acc[curr.agencyId] = { total: 0, count: 0 };
      }
      const resolutionTimeInDays = (curr.updatedAt.getTime() - curr.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      acc[curr.agencyId].total += resolutionTimeInDays;
      acc[curr.agencyId].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    // Get transfer counts by agency
    const transferCounts = await this.prisma.complaintHistory.groupBy({
      by: ['toAgencyId'],
      _count: {
        toAgencyId: true,
      },
      where: {
        action: 'TRANSFERRED',
      },
      orderBy: {
        _count: {
          toAgencyId: 'desc',
        },
      },
      take: 5,
    });

    // Get total complaints for different time periods
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);

    const thisMonth = new Date(today);
    thisMonth.setMonth(today.getMonth() - 1);

    const [todayCount, thisWeekCount, thisMonthCount] = await Promise.all([
      this.prisma.complaint.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      this.prisma.complaint.count({
        where: {
          createdAt: {
            gte: thisWeek,
          },
        },
      }),
      this.prisma.complaint.count({
        where: {
          createdAt: {
            gte: thisMonth,
          },
        },
      }),
    ]);

    // Get weekly trend data for the current year
    const currentYear = new Date().getFullYear();
    const weeklyTrends = await this.prisma.complaint.groupBy({
      by: ['createdAt'],
      _count: {
        createdAt: true,
      },
      where: {
        createdAt: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
    });

    // Format the data according to the required structure
    const complaintStatusData = statusCounts.map((status) => ({
      name: status.status,
      value: status._count,
      color: this.getStatusColor(status.status),
    }));

    const topAgenciesData = await Promise.all(
      topAgencies.map(async (agency) => {
        const agencyDetails = await this.prisma.agency.findUnique({
          where: { id: agency.agencyId },
        });
        return {
          name: agencyDetails?.name || 'Unknown Agency',
          value: agency._count.agencyId,
        };
      }),
    );

    const resolutionTimeData = await Promise.all(
      Object.entries(agencyResolutionTimes)
        .slice(0, 5)
        .map(async ([agencyId, data]) => {
          const agencyDetails = await this.prisma.agency.findUnique({
            where: { id: agencyId },
          });
          return {
            name: agencyDetails?.name || 'Unknown Agency',
            value: data.count > 0 ? data.total / data.count : 0,
          };
        }),
    );

    const transferData = await Promise.all(
      transferCounts.map(async (agency) => {
        const agencyDetails = await this.prisma.agency.findUnique({
          where: { id: agency.toAgencyId ?? undefined },
        });
        return {
          name: agencyDetails?.name || 'Unknown Agency',
          value: agency._count.toAgencyId,
        };
      }),
    );

    const totalComplaints = {
      today: todayCount,
      thisWeek: thisWeekCount,
      thisMonth: thisMonthCount,
    };

    const complaintsTrendData = this.formatWeeklyTrendData(weeklyTrends);

    return {
      success: 200,
      message: 'Super Admin Analytics fetched successfully',
      data: {
        complaintStatusData,
        topAgenciesData,
        resolutionTimeData,
        transferData,
        totalComplaints,
        complaintsTrendData,
      },
    };
  }

  private getStatusColor(status: ComplaintStatus): string {
    const colorMap = {
      [ComplaintStatus.PENDING]: '#156BEC',
      [ComplaintStatus.IN_PROGRESS]: '#0D4BA3',
      [ComplaintStatus.RESOLVED]: '#4B8EF5',
      [ComplaintStatus.REJECTED]: '#ADD0F9',
    };
    return colorMap[status] || '#156BEC';
  }

  private formatWeeklyTrendData(weeklyTrends: Array<{ createdAt: Date; _count: { createdAt: number } }>): Array<{ name: string; value: number }> {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklyData = Array.from<number>({ length: 7 }).fill(0);

    weeklyTrends.forEach((trend) => {
      const date = new Date(trend.createdAt);
      const dayOfWeek = date.getDay();
      // Convert Sunday (0) to 6, and shift other days back by 1 to make Monday (1) the first day
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weeklyData[adjustedDay] += trend._count.createdAt;
    });

    return daysOfWeek.map((day, index) => ({
      name: day,
      value: weeklyData[index],
    }));
  }

  async getAgencyAdminAnalytics(agencyId: string) {
    try {
      const [totalComplaints, statusCounts, staffAssignments, resolutionTimeData] = await Promise.all([
        this.prisma.complaint.count({ where: { agencyId } }),
        this.prisma.complaint.groupBy({
          by: ['status'],
          _count: true,
          where: { agencyId },
        }),
        this.prisma.user.findMany({
          where: { 
            agencyId,
            role: Role.STAFF,
          },
          select: {
            name: true,
            _count: {
              select: {
                assignments: true,
              },
            },
          },
        }),
        this.prisma.complaint.findMany({
          where: { agencyId, status: ComplaintStatus.RESOLVED },
          select: { createdAt: true, updatedAt: true },
        }),
      ]);

      const resolutionBuckets = {
        'Within 24h': 0, '24-48h': 0, '48-72h': 0, '>72h': 0,
      };

      resolutionTimeData.forEach(complaint => {
        const hours = (complaint.updatedAt.getTime() - complaint.createdAt.getTime()) / (1000 * 60 * 60);
        if (hours <= 24) resolutionBuckets['Within 24h']++;
        else if (hours <= 48) resolutionBuckets['24-48h']++;
        else if (hours <= 72) resolutionBuckets['48-72h']++;
        else resolutionBuckets['>72h']++;
      });

      return {
        success: 200,
        message: 'Agency Admin Analytics fetched successfully',
        data: {
          totalComplaints: {
            total: totalComplaints,
            pending: await this.prisma.complaint.count({ where: { agencyId, status: ComplaintStatus.PENDING } }),
            resolved: await this.prisma.complaint.count({ where: { agencyId, status: ComplaintStatus.RESOLVED } }),
          },
          complaintsByStats: statusCounts.map(status => ({
            name: status.status,
            value: status._count,
            color: this.getStatusColor(status.status),
          })),
          staffAssignments: staffAssignments.map(staff => ({
            name: staff.name,
            value: staff._count.assignments,
          })),
          resolutionRateData: Object.entries(resolutionBuckets).map(([name, value]) => ({ name, value })),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch agency admin analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStaffAnalytics(staffId: string) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get status distribution
      const statusData = await this.prisma.complaint.groupBy({
        by: ['status'],
        _count: true,
        where: {
          assignedTo: {
            staffId,
          },
        },
      });

      // Get aging data
      const assignedComplaints = await this.prisma.complaint.findMany({
        where: {
          assignedTo: {
            staffId,
          },
        },
        select: {
          id: true,
          subject: true,
          status: true,
          createdAt: true,
          assignedTo: {
            select: {
              assignedAt: true,
            },
          },
        },
      });

      // Calculate aging buckets
      const agingBuckets = {
        '0-24 hours': 0,
        '25-48 hours': 0,
        '49-72 hours': 0,
        '>72 hours': 0,
      };

      assignedComplaints.forEach(complaint => {
        const assignedAt = complaint.assignedTo?.assignedAt || complaint.createdAt;
        const daysSinceAssignment = Math.floor(
          (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceAssignment <= 3) agingBuckets['0-3 days']++;
        else if (daysSinceAssignment <= 7) agingBuckets['4-7 days']++;
        else if (daysSinceAssignment <= 14) agingBuckets['8-14 days']++;
        else agingBuckets['>14 days']++;
      });

      // Get resolution trends (last 4 weeks)
      const resolvedData = await this.prisma.complaint.groupBy({
        by: ['createdAt'],
        _count: true,
        where: {
          assignedTo: {
            staffId,
          },
          status: ComplaintStatus.RESOLVED,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      // Format the data
      const formattedStatusData = statusData.map(status => ({
        name: status.status,
        value: status._count,
        color: this.getStatusColor(status.status),
      }));

      const formattedAgingData = Object.entries(agingBuckets).map(([name, value]) => ({
        name,
        value,
        color: name === '0-24 hours' ? '#22C55E' : 
               name === '25-48 hours' ? '#FFA500' : 
               name === '49-72 hours' ? '#EF4444' : '#DC2626',
      }));

      // Group resolved data by week
      const weeklyResolved = [0, 0, 0, 0];
      resolvedData.forEach(item => {
        const weekIndex = Math.floor((now.getTime() - item.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weekIndex < 4) {
          weeklyResolved[weekIndex] += item._count;
        }
      });

      const formattedResolvedData = weeklyResolved.map((value, index) => ({
        name: `Week ${4 - index}`,
        value,
      }));

      const formattedAssignedComplaints = assignedComplaints.map(complaint => ({
        id: complaint.id,
        title: complaint.subject,
        status: complaint.status,
        createdAt: complaint.createdAt.toISOString().split('T')[0],
        daysSinceAssignment: Math.floor(
          (now.getTime() - (complaint.assignedTo?.assignedAt || complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));

      return {
        success: 200,
        message: 'Staff Analytics fetched successfully',
        data: {
          statusData: formattedStatusData,
          agingData: formattedAgingData,
          resolvedData: formattedResolvedData,
          assignedComplaints: formattedAssignedComplaints,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch staff analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 