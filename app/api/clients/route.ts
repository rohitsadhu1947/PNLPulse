import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

type ExtendedSessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  roles?: string[]
  permissions?: string[]
}

// GET /api/clients - List all clients
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    console.log('[API/clients] Session:', JSON.stringify(session));
    if (!session || !session.user || !(session.user as ExtendedSessionUser).id) {
      console.log('[API/clients] Unauthorized: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as ExtendedSessionUser).id!);
    console.log('[API/clients] userId:', userId);

    // Check if user has permission to view clients
    const userStart = Date.now();
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
    console.log(`[API/clients] User query took ${Date.now() - userStart}ms`);

    const hasPermission = user?.user_roles_user_roles_user_idTousers.some(
      (userRole: any) => userRole.roles.name === 'admin' || userRole.roles.name === 'sales_manager' || userRole.roles.name === 'sales_rep'
    );

    if (!hasPermission) {
      console.log('[API/clients] Forbidden: Insufficient permissions');
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const clientsStart = Date.now();
    const clients = await prisma.clients.findMany({
      include: {
        sales_representatives: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    console.log(`[API/clients] Clients query took ${Date.now() - clientsStart}ms`);
    console.log(`[API/clients] Total time: ${Date.now() - startTime}ms`);
    console.log(`[API/clients] Returning ${clients.length} clients`);

    return NextResponse.json(clients);
  } catch (error) {
    console.error('[API/clients] Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as ExtendedSessionUser).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as ExtendedSessionUser).id!);

    // Check if user has permission to create clients
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

    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }

    // Create the client
    const client = await prisma.clients.create({
      data: {
        name: body.name,
        client_type: body.client_type || null,
        industry: body.industry || null,
        website: body.website || null,
        company_size: body.company_size || null,
        hq_location: body.hq_location || null,
        pan_gst_number: body.pan_gst_number || null,
        lead_source: body.lead_source || null,
        account_owner_id: body.account_owner_id ? parseInt(body.account_owner_id) : null,
        sales_stage: body.sales_stage || null,
        deal_value: body.deal_value ? parseFloat(body.deal_value) : null,
        target_close_date: body.target_close_date ? new Date(body.target_close_date) : null,
        probability_to_close: body.probability_to_close ? parseInt(body.probability_to_close) : null,
        notes: body.notes || null,
        pricing_model: body.pricing_model || null,
        custom_requirements: body.custom_requirements || null,
        tc_compliance_status: body.tc_compliance_status || null,
        onboarding_status: body.onboarding_status || null,
        csm_assigned: body.csm_assigned || null,
        renewal_date: body.renewal_date ? new Date(body.renewal_date) : null,
      }
    });

    // Log the action
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        action: 'CREATE',
        table_name: 'clients',
        record_id: client.id,
        old_values: undefined,
        new_values: JSON.stringify(client),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 