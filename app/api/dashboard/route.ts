import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;

  if (!hasPermission(rbacUser, PERMISSIONS.DASHBOARD_VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // RBAC: If sales rep, only show their own data
    let filterSalesRepId: number | undefined = undefined;
    if (user?.roles?.includes('sales_rep')) {
      const currentUser = await prisma.users.findUnique({
        where: { id: parseInt(user.id || '0') }
      });
      if (currentUser) {
        const salesRep = await prisma.sales_representatives.findFirst({
          where: { email: currentUser.email }
        });
        if (salesRep) {
          filterSalesRepId = salesRep.id;
        }
      }
    }

    // Get total revenue from weekly_sales_reports
    const revenueData = await prisma.weekly_sales_reports.aggregate({
      _sum: {
        value_of_new_clients: true,
        invoices_raised: true,
        cash_collected: true,
      },
      where: filterSalesRepId ? { sales_rep_id: filterSalesRepId } : {},
    });

    // Get active clients count
    const activeClientsCount = await prisma.clients.count({
      where: filterSalesRepId ? {
        // If sales rep, only count clients they've worked with
        // This would need to be implemented based on your business logic
      } : {},
    });

    // Get total leads generated from sales_lead_generation
    const totalLeads = await prisma.sales_lead_generation.aggregate({
      _sum: {
        leads_generated: true,
      },
      // Note: sales_lead_generation doesn't have sales_rep_id, so we can't filter by sales rep
    });

    // Get sales performance data (last 6 months from weekly reports)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const salesPerformance = await prisma.weekly_sales_reports.groupBy({
      by: ['week_starting'],
      _sum: {
        value_of_new_clients: true,
        invoices_raised: true,
        cash_collected: true,
      },
      where: {
        week_starting: {
          gte: sixMonthsAgo,
        },
        ...(filterSalesRepId && { sales_rep_id: filterSalesRepId }),
      },
      orderBy: {
        week_starting: 'asc',
      },
    });

    // Get recent activity (last 10 weekly reports)
    const recentReports = await prisma.weekly_sales_reports.findMany({
      take: 10,
      orderBy: {
        week_starting: 'desc',
      },
      where: filterSalesRepId ? { sales_rep_id: filterSalesRepId } : {},
      include: {
        sales_representatives: true,
      },
    });

    // Calculate sales target (placeholder - could be based on historical data)
    const salesTarget = 85; // Placeholder percentage

    // Calculate month-over-month change
    const currentMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const currentMonthRevenue = await prisma.weekly_sales_reports.aggregate({
      _sum: {
        value_of_new_clients: true,
      },
      where: {
        week_starting: {
          gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        },
        ...(filterSalesRepId && { sales_rep_id: filterSalesRepId }),
      },
    });

    const lastMonthRevenue = await prisma.weekly_sales_reports.aggregate({
      _sum: {
        value_of_new_clients: true,
      },
      where: {
        week_starting: {
          gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        },
        ...(filterSalesRepId && { sales_rep_id: filterSalesRepId }),
      },
    });

    const currentRevenue = Number(currentMonthRevenue._sum.value_of_new_clients) || 0;
    const previousRevenue = Number(lastMonthRevenue._sum.value_of_new_clients) || 0;
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return NextResponse.json({
      metrics: {
        totalRevenue: Number(revenueData._sum.value_of_new_clients) || 0,
        totalInvoices: Number(revenueData._sum.invoices_raised) || 0,
        totalCashCollected: Number(revenueData._sum.cash_collected) || 0,
        activeClients: activeClientsCount,
        totalLeads: Number(totalLeads._sum?.leads_generated) || 0,
        salesTarget: salesTarget,
        revenueChange: revenueChange,
      },
      salesPerformance: salesPerformance.map((item: any) => ({
        date: item.week_starting,
        revenue: Number(item._sum.value_of_new_clients) || 0,
        invoices: Number(item._sum.invoices_raised) || 0,
        cashCollected: Number(item._sum.cash_collected) || 0,
      })),
      recentActivity: recentReports.map((report: any) => ({
        id: report.id,
        type: 'weekly_report',
        description: `Weekly Report: ${report.new_clients_added} new clients, ₹${(Number(report.value_of_new_clients) || 0).toLocaleString()} revenue`,
        amount: Number(report.value_of_new_clients) || 0,
        date: report.week_starting,
        salesRep: report.sales_representatives?.name || 'Unknown',
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
} 
