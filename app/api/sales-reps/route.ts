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

async function getSalesRepRoleId() {
  const role = await prisma.roles.findUnique({ where: { name: 'sales_rep' } });
  if (!role) throw new Error('sales_rep role not found');
  return role.id;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  
  console.log('Sales Reps API Debug:', {
    session: !!session,
    user: !!user,
    rbacUser,
    permission: PERMISSIONS.SALES_REPS_VIEW,
    hasPermission: hasPermission(rbacUser, PERMISSIONS.SALES_REPS_VIEW)
  });
  
  // Allow access if user has the permission OR if they are a sales rep (for viewing their own profile)
  const hasViewPermission = hasPermission(rbacUser, PERMISSIONS.SALES_REPS_VIEW) || 
                           hasPermission(rbacUser, 'sales_reps:read') ||
                           rbacUser?.roles?.includes('sales_rep');
  
  if (!hasViewPermission) {
    return NextResponse.json({ error: 'Forbidden', debug: { session, user, rbacUser } }, { status: 403 });
  }

  // Get all sales reps from the sales_representatives table
  const salesReps = await prisma.sales_representatives.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      hire_date: true,
      target_amount: true,
    }
  });

  return NextResponse.json({ salesReps }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  if (!hasPermission(rbacUser, PERMISSIONS.SALES_REPS_CREATE)) {
    console.log('RBAC DEBUG:', { rbacUser, permission: PERMISSIONS.SALES_REPS_CREATE });
    return NextResponse.json({ error: 'Forbidden', debug: { session, user: rbacUser } }, { status: 403 });
  }
  const body = await request.json();
  const { name, email, password, phone, hire_date, target_amount } = body;
  if (!name || !email || !password || !phone || !hire_date) {
    return NextResponse.json({ error: 'name, email, password, phone, and hire_date are required' }, { status: 400 });
  }
  let newUser;
  try {
    newUser = await prisma.users.create({
      data: { name, email, password },
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'Error creating user' }, { status: 500 });
  }
  let salesRepRoleId;
  try {
    salesRepRoleId = await getSalesRepRoleId();
    await prisma.user_roles.create({
      data: { user_id: newUser.id, role_id: salesRepRoleId },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error assigning sales_rep role' }, { status: 500 });
  }
  
  // Create record in sales_representatives table
  let salesRep;
  try {
    salesRep = await prisma.sales_representatives.create({
      data: {
        name: newUser.name,
        email: newUser.email,
        phone,
        hire_date: new Date(hire_date),
        target_amount: target_amount ? parseFloat(target_amount) : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error creating sales_representatives record' }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, user: newUser, salesRep }, { status: 201 });
}

interface OnboardSalesRepInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  hire_date: string;
  target_amount?: string | number | null;
}

export async function onboardSalesRep({ name, email, password, phone, hire_date, target_amount }: OnboardSalesRepInput) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/sales-reps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, hire_date, target_amount }),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('onboardSalesRep error:', error);
      throw new Error(error.error || 'Failed to onboard sales rep');
    }
    return await res.json();
  } catch (err: any) {
    console.error('onboardSalesRep catch:', err);
    throw new Error(err.message || 'Failed to onboard sales rep');
  }
} 