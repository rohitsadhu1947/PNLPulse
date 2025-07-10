import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

type ExtendedSessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  roles?: string[]
  permissions?: string[]
}

// GET /api/clients/[id] - Get single client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as ExtendedSessionUser).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as ExtendedSessionUser).id!);

    // Check if user has permission to view clients
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: true
          }
        }
      }
    });

    const hasPermission = user?.user_roles_user_roles_user_idTousers.some(
      (userRole: any) => userRole.roles.name === 'admin' || userRole.roles.name === 'sales_manager' || userRole.roles.name === 'sales_rep'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const client = await prisma.clients.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        sales_representatives: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        stakeholders: {
          orderBy: {
            created_at: 'desc'
          }
        },
        sales_rep_products: {
          include: {
            products: {
              select: {
                name: true,
                price: true
              }
            }
          },
          orderBy: {
            sale_date: 'desc'
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as ExtendedSessionUser).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as ExtendedSessionUser).id!);

    // Check if user has permission to update clients
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: true
          }
        }
      }
    });

    const hasPermission = user?.user_roles_user_roles_user_idTousers.some(
      (userRole: any) => userRole.roles.name === 'admin' || userRole.roles.name === 'sales_manager' || userRole.roles.name === 'sales_rep'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if user is a sales rep trying to edit a client they're not assigned to
    const isSalesRep = user?.user_roles_user_roles_user_idTousers.some(
      (userRole: any) => userRole.roles.name === 'sales_rep'
    );

    if (isSalesRep) {
      const clientId = parseInt(params.id);
      const client = await prisma.clients.findUnique({
        where: { id: clientId },
        include: {
          sales_representatives: true
        }
      });

      if (client && client.sales_representatives && Array.isArray(client.sales_representatives) && client.sales_representatives.length > 0) {
        // Check if the current user is assigned to this client
        const currentUser = await prisma.users.findUnique({
          where: { id: userId }
        });

        if (currentUser) {
          const currentSalesRep = await prisma.sales_representatives.findFirst({
            where: { email: currentUser.email }
          });

          if (currentSalesRep) {
            const isAssignedToClient = client.sales_representatives.some(
              (sr: any) => sr.id === currentSalesRep.id
            );

            if (!isAssignedToClient) {
              return NextResponse.json({ error: 'You can only edit clients assigned to you' }, { status: 403 });
            }
          }
        }
      }
    }

    // Get current client data for audit log
    const currentClient = await prisma.clients.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (!currentClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    // Build update data object with only provided fields
    const updateData: any = {};
    const updatableFields = [
      'name', 'client_type', 'industry', 'website', 'company_size', 'hq_location', 'pan_gst_number', 'lead_source',
      'account_owner_id', 'sales_stage', 'deal_value', 'target_close_date', 'probability_to_close', 'notes',
      'products_interested', 'pricing_model', 'custom_requirements', 'tc_compliance_status', 'onboarding_status',
      'csm_assigned', 'renewal_date', 'support_channels'
    ];
    updatableFields.forEach(field => {
      if (body[field] !== undefined) {
        let value = body[field];
        // Coerce empty string to null for nullable fields
        if (["custom_requirements", "notes", "tc_compliance_status", "onboarding_status", "csm_assigned", "client_type", "industry", "website", "company_size", "hq_location", "pan_gst_number", "lead_source", "sales_stage", "pricing_model", "renewal_date"].includes(field) && value === "") {
          value = null;
        }
        updateData[field] = value;
      }
    });
    // If updating name, require it not to be empty
    if ('name' in updateData && !updateData.name) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }
    // Coerce types for numeric fields if present
    if (updateData.probability_to_close !== undefined && updateData.probability_to_close !== null) {
      updateData.probability_to_close = parseInt(updateData.probability_to_close);
      if (isNaN(updateData.probability_to_close)) updateData.probability_to_close = null;
    }
    if (updateData.deal_value !== undefined && updateData.deal_value !== null) {
      updateData.deal_value = parseFloat(updateData.deal_value);
      if (isNaN(updateData.deal_value)) updateData.deal_value = null;
    }
    // Update the client
    const updatedClient = await prisma.clients.update({
      where: { id: parseInt(params.id) },
      data: updateData
    });

    // Log the action
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        action: 'UPDATE',
        table_name: 'clients',
        record_id: parseInt(params.id),
        old_values: JSON.stringify(currentClient),
        new_values: undefined,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as ExtendedSessionUser).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as ExtendedSessionUser).id!);

    // Check if user has permission to delete clients
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: true
          }
        }
      }
    });

    const hasPermission = user?.user_roles_user_roles_user_idTousers.some(
      (userRole: any) => userRole.roles.name === 'admin' || userRole.roles.name === 'sales_manager'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get current client data for audit log
    const currentClient = await prisma.clients.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (!currentClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Delete the client
    await prisma.clients.delete({
      where: { id: parseInt(params.id) }
    });

    // Log the action
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        action: 'DELETE',
        table_name: 'clients',
        record_id: parseInt(params.id),
        old_values: JSON.stringify(currentClient),
        new_values: undefined,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 