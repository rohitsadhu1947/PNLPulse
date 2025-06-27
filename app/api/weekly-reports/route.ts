import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  
  if (!hasPermission(rbacUser, PERMISSIONS.SALES_REPS_VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const salesRepId = searchParams.get('salesRepId');
    const weekStarting = searchParams.get('weekStarting');

    // Build where clause
    const where: any = {};
    
    // If user is a sales rep, only show their own reports
    if (user?.roles?.includes('sales_rep')) {
      // Find the sales rep ID for the current user
      const currentUser = await prisma.users.findUnique({
        where: { id: parseInt(user.id || '0') }
      });
      
      if (currentUser) {
        // Find the corresponding sales_representatives record
        const salesRep = await prisma.sales_representatives.findFirst({
          where: { email: currentUser.email }
        });
        
        if (salesRep) {
          where.sales_rep_id = salesRep.id;
        } else {
          // If no sales rep record found, return empty array
          return NextResponse.json([]);
        }
      } else {
        // If no user found, return empty array
        return NextResponse.json([]);
      }
    } else if (salesRepId) {
      // Admin/manager filtering by specific sales rep
      where.sales_rep_id = parseInt(salesRepId);
    }
    
    if (weekStarting) {
      where.week_starting = new Date(weekStarting);
    }

    const weeklyReports = await prisma.weekly_sales_reports.findMany({
      where,
      include: {
        sales_representatives: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        week_starting: 'desc'
      }
    });

    return NextResponse.json(weeklyReports);
  } catch (error) {
    console.error('Error fetching weekly reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  
  if (!hasPermission(rbacUser, PERMISSIONS.SALES_REPS_EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Determine the sales_rep_id based on user role
    let salesRepId: number;
    
    if (user?.roles?.includes('sales_rep')) {
      // Sales rep can only create reports for themselves
      const currentUser = await prisma.users.findUnique({
        where: { id: parseInt(user.id || '0') }
      });
      
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const salesRep = await prisma.sales_representatives.findFirst({
        where: { email: currentUser.email }
      });
      
      if (!salesRep) {
        return NextResponse.json({ error: 'Sales representative record not found' }, { status: 404 });
      }
      
      salesRepId = salesRep.id;
    } else {
      // Admin/manager can specify sales_rep_id
      if (!body.sales_rep_id) {
        return NextResponse.json({ error: 'sales_rep_id is required for admin/manager' }, { status: 400 });
      }
      salesRepId = parseInt(body.sales_rep_id);
    }
    
    // Validate required fields (excluding sales_rep_id since we set it above)
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

    // Check if sales rep exists
    const salesRep = await prisma.sales_representatives.findUnique({
      where: { id: salesRepId }
    });

    if (!salesRep) {
      return NextResponse.json({ error: 'Sales representative not found' }, { status: 404 });
    }

    // Check if a report already exists for this sales rep and week
    const existingReport = await prisma.weekly_sales_reports.findFirst({
      where: {
        sales_rep_id: salesRepId,
        week_starting: new Date(body.week_starting)
      }
    });

    if (existingReport) {
      return NextResponse.json({ error: 'A weekly report already exists for this sales representative and week' }, { status: 409 });
    }

    // Create the weekly report
    const weeklyReport = await prisma.weekly_sales_reports.create({
      data: {
        sales_rep_id: salesRepId,
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

    return NextResponse.json(weeklyReport, { status: 201 });
  } catch (error) {
    console.error('Error creating weekly report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 