"use client";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/app-layout";
import { useSessionData } from "@/hooks/use-session-data";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Target,
  Plus,
  FileText,
  BarChart3,
  Loader2,
  TrendingDown
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardData {
  metrics: {
    totalRevenue: number;
    totalInvoices: number;
    totalCashCollected: number;
    activeClients: number;
    totalLeads: number;
    salesTarget: number;
    revenueChange: number;
  };
  salesPerformance: Array<{
    date: string;
    revenue: number;
    invoices: number;
    cashCollected: number;
  }>;
  recentActivity: Array<{
    id: number;
    type: string;
    description: string;
    amount: number;
    date: string;
    salesRep: string;
  }>;
}

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: string[];
  permissions?: string[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  
  const { data: dashboardData, loading, error } = useSessionData<DashboardData>({
    endpoint: '/api/dashboard'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatChartValue = (value: number) => {
    return '₹' + value.toLocaleString();
  }

  const metrics = dashboardData ? [
    {
      title: "Total Revenue",
      value: formatCurrency(dashboardData.metrics.totalRevenue),
      change: formatPercentage(dashboardData.metrics.revenueChange),
      changeType: dashboardData.metrics.revenueChange >= 0 ? "positive" : "negative",
      icon: DollarSign,
    },
    {
      title: "Total Invoices",
      value: formatCurrency(dashboardData.metrics.totalInvoices),
      change: "N/A",
      changeType: "neutral",
      icon: FileText,
    },
    {
      title: "Cash Collected",
      value: formatCurrency(dashboardData.metrics.totalCashCollected),
      change: "N/A",
      changeType: "neutral",
      icon: TrendingUp,
    },
    {
      title: "Active Clients",
      value: dashboardData.metrics.activeClients.toString(),
      change: "N/A",
      changeType: "neutral",
      icon: Users,
    },
  ] : [];

  const quickActions = [
    { title: "Add Client", icon: Plus, href: "/clients/new" },
    { title: "Submit Report", icon: FileText, href: "/weekly-reports" },
    { title: "View Analytics", icon: BarChart3, href: "/performance-analytics" },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user?.name || user?.email}!
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {metric.title}
                  </CardTitle>
                  <metric.icon className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className={`text-xs flex items-center ${
                    metric.changeType === "positive" ? "text-green-600" : 
                    metric.changeType === "negative" ? "text-red-600" : "text-gray-500"
                  }`}>
                    {metric.changeType !== "neutral" && (
                      metric.changeType === "positive" ? 
                        <TrendingUp className="h-3 w-3 mr-1" /> : 
                        <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {metric.change} from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Performance Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Performance</CardTitle>
                  <CardDescription>
                    Revenue, invoices, and cash collection trends over the last 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData?.salesPerformance && dashboardData.salesPerformance.length > 0 ? (
                    <Line
                      data={{
                        labels: dashboardData.salesPerformance.map(d => formatDate(d.date)),
                        datasets: [
                          {
                            label: 'Revenue',
                            data: dashboardData.salesPerformance.map(d => d.revenue),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                          },
                          {
                            label: 'Invoices',
                            data: dashboardData.salesPerformance.map(d => d.invoices),
                            borderColor: 'rgb(16, 185, 129)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: false,
                          },
                          {
                            label: 'Cash Collected',
                            data: dashboardData.salesPerformance.map(d => d.cashCollected),
                            borderColor: 'rgb(245, 158, 11)',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            fill: false,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return '₹' + Number(value).toLocaleString();
                              }
                            }
                          }
                        }
                      }}
                      height={320}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      No performance data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.location.href = action.href}
                    >
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.title}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest weekly reports and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-gray-500">
                            {activity.salesRep} • {formatDate(activity.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(activity.amount)}</p>
                          <p className="text-sm text-gray-500">{activity.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 
