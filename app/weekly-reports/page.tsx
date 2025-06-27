"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/layout/app-layout';
import { Plus, FileText, Loader2, Eye, Edit } from 'lucide-react';

interface WeeklyReport {
  id: number;
  sales_rep_id: number;
  week_starting: string;
  new_clients_targeted: number;
  new_clients_added: number;
  value_of_new_clients: number;
  invoices_raised: number;
  cash_collected: number;
  key_wins: string | null;
  blockers: string | null;
  action_items: string | null;
  created_at: string;
  sales_representatives: {
    id: number;
    name: string;
    email: string;
  } | null;
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

export default function WeeklyReportsPage() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Check if user is a sales rep
  const isSalesRep = user?.roles?.includes('sales_rep');
  const isAdmin = user?.roles?.includes('admin');

  // Placeholder form state
  const [form, setForm] = useState({
    sales_rep_id: '',
    week_starting: '',
    new_clients_targeted: '',
    new_clients_added: '',
    value_of_new_clients: '',
    invoices_raised: '',
    cash_collected: '',
    key_wins: '',
    blockers: '',
    action_items: '',
  });

  // Fetch sales reps (only for admin/manager)
  const fetchSalesReps = async () => {
    if (!isSalesRep) { // Only fetch if not a sales rep
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

  // Fetch weekly reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/weekly-reports');
      if (!response.ok) {
        throw new Error('Failed to fetch weekly reports');
      }
      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchSalesReps();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSalesRepChange = (value: string) => {
    setForm({ ...form, sales_rep_id: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // For sales reps, don't send sales_rep_id (backend will set it automatically)
      const submitData = isSalesRep 
        ? { ...form, sales_rep_id: undefined }
        : form;

      const isEditing = selectedReport !== null;
      const url = isEditing ? `/api/weekly-reports/${selectedReport.id}` : '/api/weekly-reports';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'submit'} weekly report`);
      }

      const result = await response.json();
      
      if (isEditing) {
        // Update the existing report in the list
        setReports(reports.map(report => 
          report.id === selectedReport.id ? result : report
        ));
        setIsEditDialogOpen(false);
        setSelectedReport(null);
      } else {
        // Add new report to the list
        setReports([result, ...reports]);
        setOpen(false);
      }
      
      // Reset form
      setForm({
        sales_rep_id: '',
        week_starting: '',
        new_clients_targeted: '',
        new_clients_added: '',
        value_of_new_clients: '',
        invoices_raised: '',
        cash_collected: '',
        key_wins: '',
        blockers: '',
        action_items: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = (report: WeeklyReport) => {
    setSelectedReport(report);
    setIsViewDialogOpen(true);
  };

  const handleEditReport = (report: WeeklyReport) => {
    setSelectedReport(report);
    setForm({
      sales_rep_id: report.sales_rep_id.toString(),
      week_starting: report.week_starting.split('T')[0], // Convert to date format
      new_clients_targeted: report.new_clients_targeted.toString(),
      new_clients_added: report.new_clients_added.toString(),
      value_of_new_clients: report.value_of_new_clients.toString(),
      invoices_raised: report.invoices_raised.toString(),
      cash_collected: report.cash_collected.toString(),
      key_wins: report.key_wins || '',
      blockers: report.blockers || '',
      action_items: report.action_items || '',
    });
    setIsEditDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weekly Reports</h1>
            <p className="text-gray-600 mt-2">
              Track and manage weekly sales performance reports
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogTitle>Create Weekly Report</DialogTitle>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Only show sales rep dropdown for admin/manager */}
                  {!isSalesRep && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Sales Representative</label>
                      <Select value={form.sales_rep_id} onValueChange={handleSalesRepChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sales rep" />
                        </SelectTrigger>
                        <SelectContent>
                          {salesReps.map((rep) => (
                            <SelectItem key={rep.id} value={rep.id.toString()}>
                              {rep.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Week Starting</label>
                    <Input 
                      type="date" 
                      name="week_starting" 
                      value={form.week_starting} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">New Clients Targeted</label>
                    <Input 
                      type="number" 
                      name="new_clients_targeted" 
                      value={form.new_clients_targeted} 
                      onChange={handleChange} 
                      required 
                      placeholder="0" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">New Clients Added</label>
                    <Input 
                      type="number" 
                      name="new_clients_added" 
                      value={form.new_clients_added} 
                      onChange={handleChange} 
                      required 
                      placeholder="0" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Value of New Clients</label>
                    <Input 
                      type="number" 
                      name="value_of_new_clients" 
                      value={form.value_of_new_clients} 
                      onChange={handleChange} 
                      required 
                      placeholder="0" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Invoices Raised</label>
                    <Input 
                      type="number" 
                      name="invoices_raised" 
                      value={form.invoices_raised} 
                      onChange={handleChange} 
                      required 
                      placeholder="0" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Cash Collected</label>
                    <Input 
                      type="number" 
                      name="cash_collected" 
                      value={form.cash_collected} 
                      onChange={handleChange} 
                      required 
                      placeholder="0" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Key Wins</label>
                  <Textarea 
                    name="key_wins" 
                    value={form.key_wins} 
                    onChange={handleChange} 
                    placeholder="What went well this week?" 
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Blockers</label>
                  <Textarea 
                    name="blockers" 
                    value={form.blockers} 
                    onChange={handleChange} 
                    placeholder="What challenges did you face?" 
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Action Items</label>
                  <Textarea 
                    name="action_items" 
                    value={form.action_items} 
                    onChange={handleChange} 
                    placeholder="What are your next steps?" 
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600 text-center">
                  {isSalesRep 
                    ? "You haven't submitted any weekly reports yet."
                    : "No weekly reports have been submitted yet."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {report.sales_representatives?.name || 'Unknown Sales Rep'}
                        </CardTitle>
                        <CardDescription>
                          Week starting {new Date(report.week_starting).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditReport(report)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">New Clients</p>
                        <p className="text-lg font-semibold">{report.new_clients_added}/{report.new_clients_targeted}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Value</p>
                        <p className="text-lg font-semibold">{formatCurrency(report.value_of_new_clients)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Invoices</p>
                        <p className="text-lg font-semibold">{formatCurrency(report.invoices_raised)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cash Collected</p>
                        <p className="text-lg font-semibold">{formatCurrency(report.cash_collected)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogTitle>Weekly Report Details</DialogTitle>
            {selectedReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Sales Representative</label>
                    <p className="text-sm text-gray-900">{selectedReport.sales_representatives?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Week Starting</label>
                    <p className="text-sm text-gray-900">{new Date(selectedReport.week_starting).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">New Clients Targeted</label>
                    <p className="text-sm text-gray-900">{selectedReport.new_clients_targeted}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">New Clients Added</label>
                    <p className="text-sm text-gray-900">{selectedReport.new_clients_added}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Value of New Clients</label>
                    <p className="text-sm text-gray-900">₹{selectedReport.value_of_new_clients.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Invoices Raised</label>
                    <p className="text-sm text-gray-900">₹{selectedReport.invoices_raised.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cash Collected</label>
                    <p className="text-sm text-gray-900">₹{selectedReport.cash_collected.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Key Wins</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedReport.key_wins || 'None'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Blockers</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedReport.blockers || 'None'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Action Items</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedReport.action_items || 'None'}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogTitle>Edit Weekly Report</DialogTitle>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Only show sales rep dropdown for admin/manager */}
                {!isSalesRep && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Sales Representative</label>
                    <Select value={form.sales_rep_id} onValueChange={handleSalesRepChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sales rep" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesReps.map((rep) => (
                          <SelectItem key={rep.id} value={rep.id.toString()}>
                            {rep.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Show sales rep info for sales reps */}
                {isSalesRep && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Sales Representative</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">{selectedReport?.sales_representatives?.name || 'You'}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Week Starting</label>
                  <Input 
                    type="date" 
                    name="week_starting" 
                    value={form.week_starting} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">New Clients Targeted</label>
                  <Input 
                    type="number" 
                    name="new_clients_targeted" 
                    value={form.new_clients_targeted} 
                    onChange={handleChange} 
                    required 
                    placeholder="0" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">New Clients Added</label>
                  <Input 
                    type="number" 
                    name="new_clients_added" 
                    value={form.new_clients_added} 
                    onChange={handleChange} 
                    required 
                    placeholder="0" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Value of New Clients</label>
                  <Input 
                    type="number" 
                    name="value_of_new_clients" 
                    value={form.value_of_new_clients} 
                    onChange={handleChange} 
                    required 
                    placeholder="0" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Invoices Raised</label>
                  <Input 
                    type="number" 
                    name="invoices_raised" 
                    value={form.invoices_raised} 
                    onChange={handleChange} 
                    required 
                    placeholder="0" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Cash Collected</label>
                  <Input 
                    type="number" 
                    name="cash_collected" 
                    value={form.cash_collected} 
                    onChange={handleChange} 
                    required 
                    placeholder="0" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Key Wins</label>
                <Textarea 
                  name="key_wins" 
                  value={form.key_wins} 
                  onChange={handleChange} 
                  placeholder="What went well this week?" 
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Blockers</label>
                <Textarea 
                  name="blockers" 
                  value={form.blockers} 
                  onChange={handleChange} 
                  placeholder="What challenges did you face?" 
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Action Items</label>
                <Textarea 
                  name="action_items" 
                  value={form.action_items} 
                  onChange={handleChange} 
                  placeholder="What are your next steps?" 
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Report'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 