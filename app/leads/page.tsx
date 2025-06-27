"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/layout/app-layout";
import { 
  Plus, 
  Search, 
  Eye, 
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  Loader2,
  Calendar,
  Users,
  Target,
  ArrowRight
} from "lucide-react";

interface LeadHandover {
  id: number;
  generator_id: number;
  recipient_id: number;
  client_id: number;
  leads_generated: number;
  leads_converted: number;
  value_of_converted_leads: number;
  commission_percentage: number;
  commission_amount: number;
  created_at: string;
  generator?: {
    name: string;
  };
  recipient?: {
    name: string;
  };
  client?: {
    name: string;
  };
}

interface SalesRep {
  id: number;
  name: string;
}

interface Client {
  id: number;
  name: string;
}

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leadHandovers, setLeadHandovers] = useState<LeadHandover[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    generator_id: "",
    recipient_id: "",
    client_id: "",
    leads_generated: "",
    leads_converted: "",
    value_of_converted_leads: "",
    commission_percentage: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsRes, salesRepsRes, clientsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/sales-reps'),
        fetch('/api/clients')
      ]);

      if (!leadsRes.ok || !salesRepsRes.ok || !clientsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [leadsData, salesRepsData, clientsData] = await Promise.all([
        leadsRes.json(),
        salesRepsRes.json(),
        clientsRes.json()
      ]);

      setLeadHandovers(leadsData || []);
      setSalesReps(salesRepsData.salesReps || []);
      setClients(clientsData || []);
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeadHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          generator_id: parseInt(createForm.generator_id),
          recipient_id: parseInt(createForm.recipient_id),
          client_id: parseInt(createForm.client_id),
          leads_generated: parseInt(createForm.leads_generated),
          leads_converted: parseInt(createForm.leads_converted),
          value_of_converted_leads: parseFloat(createForm.value_of_converted_leads),
          commission_percentage: parseFloat(createForm.commission_percentage)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create lead handover');
      }

      setIsCreateDialogOpen(false);
      setCreateForm({
        generator_id: "",
        recipient_id: "",
        client_id: "",
        leads_generated: "",
        leads_converted: "",
        value_of_converted_leads: "",
        commission_percentage: ""
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error creating lead handover:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredLeadHandovers = leadHandovers.filter(handover => {
    const searchLower = searchTerm.toLowerCase();
    const generatorName = handover.generator?.name || 'Unknown';
    const recipientName = handover.recipient?.name || 'Unknown';
    return (
      generatorName.toLowerCase().includes(searchLower) ||
      recipientName.toLowerCase().includes(searchLower)
    );
  });

  const totalLeadsGenerated = leadHandovers.reduce((sum, handover) => sum + Number(handover.leads_generated || 0), 0);
  const totalLeadsConverted = leadHandovers.reduce((sum, handover) => sum + Number(handover.leads_converted || 0), 0);
  const totalValue = leadHandovers.reduce((sum, handover) => sum + Number(handover.value_of_converted_leads || 0), 0);
  const totalCommissions = leadHandovers.reduce((sum, handover) => sum + Number(handover.commission_amount || 0), 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
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
            <h1 className="text-3xl font-bold text-gray-900">Lead Handover Management</h1>
            <p className="text-gray-600 mt-2">
              Track and manage lead handovers between sales representatives
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Leads Generated
                </CardTitle>
                <Target className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLeadsGenerated}</div>
                <p className="text-xs text-gray-500">
                  Across all handovers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Leads Converted
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLeadsConverted}</div>
                <p className="text-xs text-gray-500">
                  Successfully converted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-gray-500">
                  From converted leads
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Commissions
                </CardTitle>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
                <p className="text-xs text-gray-500">
                  Paid out
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by generator or recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Lead Handover
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Lead Handover</DialogTitle>
                  <DialogDescription>
                    Create a new lead handover record between sales representatives.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateLeadHandover} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="generator_id">Lead Generator</Label>
                      <Select
                        value={createForm.generator_id}
                        onValueChange={(value) => setCreateForm(prev => ({ ...prev, generator_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select generator" />
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
                    <div>
                      <Label htmlFor="recipient_id">Lead Recipient</Label>
                      <Select
                        value={createForm.recipient_id}
                        onValueChange={(value) => setCreateForm(prev => ({ ...prev, recipient_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient" />
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
                  </div>
                  <div>
                    <Label htmlFor="client_id">Client</Label>
                    <Select
                      value={createForm.client_id}
                      onValueChange={(value) => setCreateForm(prev => ({ ...prev, client_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leads_generated">Leads Generated</Label>
                      <Input
                        id="leads_generated"
                        type="number"
                        value={createForm.leads_generated}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, leads_generated: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="leads_converted">Leads Converted</Label>
                      <Input
                        id="leads_converted"
                        type="number"
                        value={createForm.leads_converted}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, leads_converted: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="value_of_converted_leads">Value of Converted Leads</Label>
                      <Input
                        id="value_of_converted_leads"
                        type="number"
                        value={createForm.value_of_converted_leads}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, value_of_converted_leads: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="commission_percentage">Commission %</Label>
                      <Input
                        id="commission_percentage"
                        type="number"
                        step="0.01"
                        value={createForm.commission_percentage}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, commission_percentage: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Create Handover
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Lead Handovers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Handovers</CardTitle>
              <CardDescription>
                Recent lead handover transactions between sales representatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Generator</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Leads Generated</TableHead>
                    <TableHead>Leads Converted</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeadHandovers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No lead handovers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeadHandovers.map((handover) => (
                      <TableRow key={handover.id}>
                        <TableCell className="font-medium">
                          {handover.generator?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {handover.recipient?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {handover.client?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{handover.leads_generated}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{handover.leads_converted}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(handover.value_of_converted_leads)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(handover.commission_amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="mr-1 h-3 w-3" />
                            {formatDate(handover.created_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 