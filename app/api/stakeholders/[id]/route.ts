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

// GET /api/stakeholders/[id] - Get single stakeholder
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

    const stakeholder = await prisma.stakeholders.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        clients: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!stakeholder) {
      return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    }

    return NextResponse.json(stakeholder);
  } catch (error) {
    console.error('Error fetching stakeholder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/stakeholders/[id] - Update stakeholder
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

    // Check if user has permission to update stakeholders
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

    // Check if user is a sales rep trying to edit a stakeholder of a client they're not assigned to
    const isSalesRep = user?.user_roles_user_roles_user_idTousers.some(
      (userRole: any) => userRole.roles.name === 'sales_rep'
    );

    if (isSalesRep) {
      const stakeholderId = parseInt(params.id);
      const stakeholder = await prisma.stakeholders.findUnique({
        where: { id: stakeholderId },
        include: {
          clients: {
            include: {
              sales_representatives: true
            }
          }
        }
      });

      if (stakeholder && stakeholder.clients) {
        const currentUser = await prisma.users.findUnique({
          where: { id: userId }
        });

        if (currentUser) {
          const currentSalesRep = await prisma.sales_representatives.findFirst({
            where: { email: currentUser.email }
          });

          if (currentSalesRep && stakeholder.clients.sales_representatives && Array.isArray(stakeholder.clients.sales_representatives)) {
            const isAssignedToClient = stakeholder.clients.sales_representatives.some(
              (sr: any) => sr.id === currentSalesRep.id
            );

            if (!isAssignedToClient) {
              return NextResponse.json({ error: 'You can only edit stakeholders of clients assigned to you' }, { status: 403 });
            }
          }
        }
      }
    }

    // Get current stakeholder data for audit log
    const currentStakeholder = await prisma.stakeholders.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (!currentStakeholder) {
      return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Stakeholder name is required' },
        { status: 400 }
      );
    }

    // Update the stakeholder
    const updatedStakeholder = await prisma.stakeholders.update({
      where: { id: parseInt(params.id) },
      data: {
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
        action: 'UPDATE',
        table_name: 'stakeholders',
        record_id: parseInt(params.id),
        old_values: JSON.stringify(currentStakeholder),
        new_values: undefined,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json(updatedStakeholder);
  } catch (error) {
    console.error('Error updating stakeholder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/stakeholders/[id] - Delete stakeholder
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

    // Check if user has permission to delete stakeholders
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

    // Get current stakeholder data for audit log
    const currentStakeholder = await prisma.stakeholders.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (!currentStakeholder) {
      return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    }

    // Delete the stakeholder
    await prisma.stakeholders.delete({
      where: { id: parseInt(params.id) }
    });

    // Log the action
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        action: 'DELETE',
        table_name: 'stakeholders',
        record_id: parseInt(params.id),
        old_values: JSON.stringify(currentStakeholder),
        new_values: undefined,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ message: 'Stakeholder deleted successfully' });
  } catch (error) {
    console.error('Error deleting stakeholder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 