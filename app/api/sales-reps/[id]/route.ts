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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  
  if (!hasPermission(rbacUser, PERMISSIONS.SALES_REPS_VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const salesRepId = parseInt(params.id);
    if (isNaN(salesRepId)) {
      return NextResponse.json({ error: 'Invalid sales rep ID' }, { status: 400 });
    }

    const salesRep = await prisma.sales_representatives.findUnique({
      where: { id: salesRepId }
    });

    if (!salesRep) {
      return NextResponse.json({ error: 'Sales representative not found' }, { status: 404 });
    }

    return NextResponse.json(salesRep, { status: 200 });
  } catch (error) {
    console.error('Error fetching sales rep:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const salesRepId = parseInt(params.id);
    if (isNaN(salesRepId)) {
      return NextResponse.json({ error: 'Invalid sales rep ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, phone, hire_date, target_amount } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if sales rep exists
    const existingSalesRep = await prisma.sales_representatives.findUnique({
      where: { id: salesRepId }
    });

    if (!existingSalesRep) {
      return NextResponse.json({ error: 'Sales representative not found' }, { status: 404 });
    }

    // Update sales representative
    const updatedSalesRep = await prisma.sales_representatives.update({
      where: { id: salesRepId },
      data: {
        name,
        email,
        phone: phone || null,
        hire_date: hire_date ? new Date(hire_date) : existingSalesRep.hire_date,
        target_amount: target_amount ? parseFloat(target_amount) : null,
      }
    });

    // Also update the corresponding user record
    await prisma.users.update({
      where: { email: existingSalesRep.email },
      data: {
        name,
        email,
      }
    });

    return NextResponse.json(updatedSalesRep, { status: 200 });
  } catch (error) {
    console.error('Error updating sales rep:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  
  if (!hasPermission(rbacUser, PERMISSIONS.SALES_REPS_DELETE)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const salesRepId = parseInt(params.id);
    if (isNaN(salesRepId)) {
      return NextResponse.json({ error: 'Invalid sales rep ID' }, { status: 400 });
    }

    // Check if sales rep exists
    const existingSalesRep = await prisma.sales_representatives.findUnique({
      where: { id: salesRepId }
    });

    if (!existingSalesRep) {
      return NextResponse.json({ error: 'Sales representative not found' }, { status: 404 });
    }

    // Delete the sales representative
    await prisma.sales_representatives.delete({
      where: { id: salesRepId }
    });

    // Delete the corresponding user
    await prisma.users.delete({
      where: { email: existingSalesRep.email }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting sales rep:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 