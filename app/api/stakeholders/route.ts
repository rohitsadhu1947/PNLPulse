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

// GET /api/stakeholders - List all stakeholders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as ExtendedSessionUser).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as ExtendedSessionUser).id!);

    // Check if user has permission to view stakeholders
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

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    const whereClause = clientId ? { client_id: parseInt(clientId) } : {};

    const stakeholders = await prisma.stakeholders.findMany({
      where: whereClause,
      include: {
        clients: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(stakeholders);
  } catch (error) {
    console.error('Error fetching stakeholders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/stakeholders - Create new stakeholder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as ExtendedSessionUser).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as ExtendedSessionUser).id!);

    // Check if user has permission to create stakeholders
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
    if (!body.name || !body.client_id) {
      return NextResponse.json(
        { error: 'Stakeholder name and client ID are required' },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.clients.findUnique({
      where: { id: parseInt(body.client_id) }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Create the stakeholder
    const stakeholder = await prisma.stakeholders.create({
      data: {
        client_id: parseInt(body.client_id),
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        designation: body.designation || null,
        decision_role: body.decision_role || null,
        relationship_status: body.relationship_status || null,
      }
    });

    // Log the action
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        action: 'CREATE',
        table_name: 'stakeholders',
        record_id: stakeholder.id,
        old_values: undefined,
        new_values: JSON.stringify(stakeholder),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json(stakeholder, { status: 201 });
  } catch (error) {
    console.error('Error creating stakeholder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 