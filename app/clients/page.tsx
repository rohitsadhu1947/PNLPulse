"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/app-layout";
import { useSessionData } from "@/hooks/use-session-data";
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  MoreHorizontal,
  Users,
  Loader2
} from "lucide-react";

interface Client {
  id: number;
  name: string;
  client_type: string | null;
  industry: string | null;
  website: string | null;
  company_size: string | null;
  hq_location: string | null;
  sales_stage: string | null;
  deal_value: number | null;
  probability_to_close: number | null;
  created_at: string;
  sales_representatives?: {
    name: string;
  } | null;
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState("all");

  const { data: clients = [], loading, error } = useSessionData<Client[]>({
    endpoint: '/api/clients'
  });

  const user = session?.user as any;
  const canEditClient = user?.permissions?.includes('clients:edit') || user?.roles?.includes('admin') || user?.roles?.includes('sales_manager');

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStageColor = (stage: string | null) => {
    if (!stage) return "gray";
    switch (stage.toLowerCase()) {
      case 'prospecting': return 'blue';
      case 'qualification': return 'yellow';
      case 'proposal': return 'orange';
      case 'negotiation': return 'purple';
      case 'closed won': return 'green';
      case 'closed lost': return 'red';
      default: return 'gray';
    }
  };

  const filteredClients = (clients || []).filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.hq_location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = filterStage === "all" || client.sales_stage === filterStage;
    
    return matchesSearch && matchesStage;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading clients...</p>
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
                <p className="text-gray-600 mt-2">
                  Manage your client relationships and sales pipeline
                </p>
              </div>
              <Button onClick={() => window.location.href = '/clients/new'}>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{(clients || []).length}</p>
                    <p className="text-gray-600">Total Clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Stages</option>
                    <option value="Prospecting">Prospecting</option>
                    <option value="Qualification">Qualification</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed Won">Closed Won</option>
                    <option value="Closed Lost">Closed Lost</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Client List</CardTitle>
              <CardDescription>
                Showing {filteredClients.length} of {(clients || []).length} clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Sales Stage</TableHead>
                      <TableHead>Deal Value</TableHead>
                      <TableHead>Account Owner</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{client.name}</div>
                              {client.website && (
                                <div className="text-sm text-gray-500">
                                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {client.website}
                                  </a>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{client.industry || "N/A"}</div>
                              {client.company_size && (
                                <div className="text-sm text-gray-500">{client.company_size}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{client.hq_location || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={getStageColor(client.sales_stage) as any}>
                              {client.sales_stage || "Not Set"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{formatCurrency(client.deal_value)}</div>
                              {client.probability_to_close && (
                                <div className="text-sm text-gray-500">
                                  {client.probability_to_close}% probability
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{client.sales_representatives?.name || "Unassigned"}</TableCell>
                          <TableCell>{formatDate(client.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = `/clients/${client.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEditClient && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.location.href = `/clients/${client.id}/edit`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No clients found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 