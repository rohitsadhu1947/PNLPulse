import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { prisma } from '@/lib/db';

type ExtendedSessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: string[];
  permissions?: string[];
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  
  if (!hasPermission(rbacUser, PERMISSIONS.SALES_REPS_EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const reportId = parseInt(params.id);
    const body = await request.json();

    // First, get the existing report to check permissions
    const existingReport = await prisma.weekly_sales_reports.findUnique({
      where: { id: reportId },
      include: {
        sales_representatives: true
      }
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Weekly report not found' }, { status: 404 });
    }

    // Check if user can edit this report
    if (user?.roles?.includes('sales_rep')) {
      // Sales rep can only edit their own reports
      const currentUser = await prisma.users.findUnique({
        where: { id: parseInt(user.id || '0') }
      });
      
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const salesRep = await prisma.sales_representatives.findFirst({
        where: { email: currentUser.email }
      });
      
      if (!salesRep || existingReport.sales_rep_id !== salesRep.id) {
        return NextResponse.json({ error: 'You can only edit your own reports' }, { status: 403 });
      }
    }

    // Validate required fields
    const requiredFields = ['week_starting', 'new_clients_targeted', 'new_clients_added', 'value_of_new_clients', 'invoices_raised', 'cash_collected'];
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate numeric fields
    const numericFields = ['new_clients_targeted', 'new_clients_added', 'value_of_new_clients', 'invoices_raised', 'cash_collected'];
    for (const field of numericFields) {
      const value = Number(body[field]);
      if (isNaN(value) || value < 0) {
        return NextResponse.json({ error: `Invalid value for ${field}: must be a non-negative number` }, { status: 400 });
      }
      if (field.includes('value') || field.includes('invoices') || field.includes('cash')) {
        if (value > 1000000000) { // 1 billion limit
          return NextResponse.json({ error: `Value too large for ${field}` }, { status: 400 });
        }
      }
    }

    // Update the weekly report
    const updatedReport = await prisma.weekly_sales_reports.update({
      where: { id: reportId },
      data: {
        week_starting: new Date(body.week_starting),
        new_clients_targeted: parseInt(body.new_clients_targeted),
        new_clients_added: parseInt(body.new_clients_added),
        value_of_new_clients: parseFloat(body.value_of_new_clients),
        invoices_raised: parseFloat(body.invoices_raised),
        cash_collected: parseFloat(body.cash_collected),
        key_wins: body.key_wins || null,
        blockers: body.blockers || null,
        action_items: body.action_items || null,
      },
      include: {
        sales_representatives: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Error updating weekly report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 