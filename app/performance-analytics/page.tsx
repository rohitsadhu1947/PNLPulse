'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Calendar,
  BarChart3,
  LineChart,
  PieChart,
  Download
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceData {
  period: string;
  revenue: number;
  invoices: number;
  cashCollected: number;
  gap: number;
  newClients: number;
  activeClients: number;
}

interface SalesRep {
  id: number;
  name: string;
  email: string;
}

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: string[];
  permissions?: string[];
}

export default function PerformanceAnalyticsPage() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalCashCollected: 0,
    totalGap: 0,
    avgGapPercentage: 0,
    totalNewClients: 0,
    totalActiveClients: 0
  });

  const isSalesRep = user?.roles?.includes('sales_rep');
  const isAdmin = user?.roles?.includes('admin');

  // Fetch sales reps (only for admin/manager)
  const fetchSalesReps = async () => {
    if (!isSalesRep) {
      try {
        const response = await fetch('/api/sales-reps');
        if (!response.ok) {
          throw new Error('Failed to fetch sales representatives');
        }
        const data = await response.json();
        setSalesReps(data.salesReps || []);
      } catch (err) {
        console.error('Error fetching sales reps:', err);
        setSalesReps([]);
      }
    }
  };

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(selectedSalesRep !== 'all' && { salesRepId: selectedSalesRep })
      });

      const response = await fetch(`/api/performance-analytics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      const data = await response.json();
      setPerformanceData(data.performanceData || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReps();
  }, []);

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod, selectedSalesRep]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <TrendingUp className="h-4 w-4 text-gray-500" />;
  };

  const getGapStatus = (gap: number, invoices: number = 0) => {
    if (invoices === 0) return { color: 'bg-gray-100 text-gray-800', label: 'No Data' };
    
    const gapPercentage = (gap / invoices) * 100;
    
    if (gap <= 0) return { color: 'bg-green-100 text-green-800', label: 'Excellent' };
    if (gapPercentage <= 10) return { color: 'bg-green-100 text-green-800', label: 'Excellent' };
    if (gapPercentage <= 25) return { color: 'bg-yellow-100 text-yellow-800', label: 'Good' };
    if (gapPercentage <= 50) return { color: 'bg-orange-100 text-orange-800', label: 'Fair' };
    return { color: 'bg-red-100 text-red-800', label: 'Needs Attention' };
  };

  const formatChartValue = (value: number) => {
    return '₹' + value.toLocaleString();
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive analysis of sales performance, revenue trends, and collection efficiency
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isSalesRep && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Representative
                </label>
                <Select value={selectedSalesRep} onValueChange={setSelectedSalesRep}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Representatives</SelectItem>
                    {salesReps.map((rep) => (
                      <SelectItem key={rep.id} value={rep.id.toString()}>
                        {rep.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrencyCompact(summary.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrencyCompact(summary.totalInvoices)}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cash Collected</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrencyCompact(summary.totalCashCollected)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Collection Gap</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrencyCompact(summary.totalGap)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {summary.avgGapPercentage.toFixed(1)}% of invoices
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analytics */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>
                      Revenue performance over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {performanceData.length > 0 ? (
                      <div className="h-80">
                        <Line
                          data={{
                            labels: performanceData.map(d => d.period),
                            datasets: [
                              {
                                label: 'Revenue',
                                data: performanceData.map(d => d.revenue),
                                borderColor: 'rgb(59, 130, 246)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                fill: true,
                              },
                              {
                                label: 'Invoices',
                                data: performanceData.map(d => d.invoices),
                                borderColor: 'rgb(16, 185, 129)',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
                        />
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No data available for the selected period</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Collection Efficiency</CardTitle>
                    <CardDescription>
                      Cash collection vs invoices raised
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {performanceData.length > 0 ? (
                      <div className="h-80">
                        <Bar
                          data={{
                            labels: performanceData.map(d => d.period),
                            datasets: [
                              {
                                label: 'Invoices Raised',
                                data: performanceData.map(d => d.invoices),
                                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                              },
                              {
                                label: 'Cash Collected',
                                data: performanceData.map(d => d.cashCollected),
                                backgroundColor: 'rgba(16, 185, 129, 0.8)',
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
                        />
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No data available for the selected period</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client Growth Trends</CardTitle>
                  <CardDescription>
                    New client acquisition and active client retention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceData.length > 0 ? (
                    <div className="h-80">
                      <Line
                        data={{
                          labels: performanceData.map(d => d.period),
                          datasets: [
                            {
                              label: 'New Clients',
                              data: performanceData.map(d => d.newClients),
                              borderColor: 'rgb(16, 185, 129)',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              fill: false,
                            },
                            {
                              label: 'Active Clients',
                              data: performanceData.map(d => d.activeClients),
                              borderColor: 'rgb(59, 130, 246)',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No data available for the selected period</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Comprehensive performance analysis and KPIs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceData.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="h-80">
                        <h4 className="text-sm font-medium mb-4">Revenue Distribution</h4>
                        <div className="h-64">
                          <Doughnut
                            data={{
                              labels: performanceData.map(d => d.period),
                              datasets: [
                                {
                                  data: performanceData.map(d => d.revenue),
                                  backgroundColor: [
                                    'rgba(59, 130, 246, 0.8)',
                                    'rgba(16, 185, 129, 0.8)',
                                    'rgba(245, 158, 11, 0.8)',
                                    'rgba(239, 68, 68, 0.8)',
                                    'rgba(139, 92, 246, 0.8)',
                                  ],
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom' as const,
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                      <div className="h-80">
                        <h4 className="text-sm font-medium mb-4">Collection Efficiency</h4>
                        <div className="h-64">
                          <Bar
                            data={{
                              labels: performanceData.map(d => d.period),
                              datasets: [
                                {
                                  label: 'Collection Rate (%)',
                                  data: performanceData.map(d => 
                                    d.invoices > 0 ? ((d.cashCollected / d.invoices) * 100) : 0
                                  ),
                                  backgroundColor: performanceData.map(d => {
                                    const rate = d.invoices > 0 ? (d.cashCollected / d.invoices) * 100 : 0;
                                    if (rate >= 90) return 'rgba(16, 185, 129, 0.8)';
                                    if (rate >= 75) return 'rgba(245, 158, 11, 0.8)';
                                    return 'rgba(239, 68, 68, 0.8)';
                                  }),
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: false,
                                },
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  max: 100,
                                  ticks: {
                                    callback: function(value) {
                                      return '₹' + Number(value).toLocaleString();
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No data available for the selected period</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Detailed Data Table */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Detailed Performance Data</CardTitle>
              <CardDescription>
                Period-by-period breakdown of all metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No performance data available for the selected criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoices
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cash Collected
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gap
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gap %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          New Clients
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Active Clients
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {performanceData.map((data, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {data.period}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(data.revenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(data.invoices)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(data.cashCollected)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={data.gap > 0 ? 'text-red-600' : 'text-green-600'}>
                              {formatCurrency(data.gap)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Badge className={getGapStatus(data.gap, data.invoices).color}>
                              {data.invoices > 0 ? formatPercentage((data.gap / data.invoices) * 100) : '0%'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {data.newClients}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {data.activeClients}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 