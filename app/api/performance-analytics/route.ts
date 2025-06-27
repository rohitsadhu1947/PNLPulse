import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { prisma } from '@/lib/db';

const PERIOD_FORMATS = {
  weekly: 'YYYY-ww',
  monthly: 'YYYY-MM',
  quarterly: 'YYYY-Q',
};

function getPeriodKey(date: Date, period: string) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const week = getWeekNumber(date);
  if (period === 'weekly') return `${year}-W${week.toString().padStart(2, '0')}`;
  if (period === 'monthly') return `${year}-${month.toString().padStart(2, '0')}`;
  if (period === 'quarterly') return `${year}-Q${Math.floor((month - 1) / 3) + 1}`;
  return `${year}-${month.toString().padStart(2, '0')}`;
}

function getWeekNumber(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;

  if (!hasPermission(rbacUser, PERMISSIONS.DASHBOARD_VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'monthly';
  const salesRepId = searchParams.get('salesRepId');

  // RBAC: If sales rep, only allow their own data
  let filterSalesRepId: number | undefined = undefined;
  if (user?.roles?.includes('sales_rep')) {
    // Find the sales rep record for this user
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
  } else if (salesRepId && salesRepId !== 'all') {
    filterSalesRepId = parseInt(salesRepId);
  }

  // Fetch all relevant weekly reports
  const reports = await prisma.weekly_sales_reports.findMany({
    where: filterSalesRepId ? { sales_rep_id: filterSalesRepId } : {},
    orderBy: { week_starting: 'asc' },
  });

  // Fetch all clients (for new/active client metrics)
  const clients = await prisma.clients.findMany({});

  // Aggregate by period
  const periodMap: Record<string, any> = {};
  for (const report of reports) {
    const key = getPeriodKey(new Date(report.week_starting), period);
    if (!periodMap[key]) {
      periodMap[key] = {
        period: key,
        revenue: 0,
        invoices: 0,
        cashCollected: 0,
        gap: 0,
        newClients: 0,
        activeClients: 0,
      };
    }
    periodMap[key].revenue += Number(report.value_of_new_clients) || 0;
    periodMap[key].invoices += Number(report.invoices_raised) || 0;
    periodMap[key].cashCollected += Number(report.cash_collected) || 0;
    periodMap[key].gap += (Number(report.invoices_raised) || 0) - (Number(report.cash_collected) || 0);
    periodMap[key].newClients += Number(report.new_clients_added) || 0;
    // For active clients, count unique client IDs with sales in this period (not implemented here, placeholder)
    // periodMap[key].activeClients = ...
  }

  // Calculate active clients per period (clients with sales in that period)
  for (const key of Object.keys(periodMap)) {
    // Find all reports in this period
    const periodReports = reports.filter(r => getPeriodKey(new Date(r.week_starting), period) === key);
    // Find all unique client IDs from sales in this period (if you have a sales table, use it; else, use new_clients_added as a proxy)
    // For now, just use new_clients_added as a proxy
    periodMap[key].activeClients = periodReports.reduce((sum, r) => sum + (Number(r.new_clients_added) || 0), 0);
  }

  // Prepare period-by-period data
  const performanceData = Object.values(periodMap).sort((a, b) => a.period.localeCompare(b.period));

  // Summary
  const totalRevenue = performanceData.reduce((sum, p) => sum + p.revenue, 0);
  const totalInvoices = performanceData.reduce((sum, p) => sum + p.invoices, 0);
  const totalCashCollected = performanceData.reduce((sum, p) => sum + p.cashCollected, 0);
  const totalGap = performanceData.reduce((sum, p) => sum + p.gap, 0);
  const totalNewClients = performanceData.reduce((sum, p) => sum + p.newClients, 0);
  const totalActiveClients = performanceData.reduce((sum, p) => sum + p.activeClients, 0);
  const avgGapPercentage = totalInvoices > 0 ? (totalGap / totalInvoices) * 100 : 0;

  return NextResponse.json({
    performanceData,
    summary: {
      totalRevenue,
      totalInvoices,
      totalCashCollected,
      totalGap,
      avgGapPercentage,
      totalNewClients,
      totalActiveClients,
    },
  });
} 