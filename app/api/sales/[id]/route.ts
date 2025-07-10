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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  if (!hasPermission(rbacUser, PERMISSIONS.SALES_REPS_VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const id = parseInt(params.id);
  const sale = await prisma.sales_rep_products.findUnique({
    where: { id },
    include: {
      sales_representatives: { select: { name: true } },
      products: { select: { name: true, price: true } },
      clients: { select: { name: true } },
    },
  });
  if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(sale);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  if (!hasPermission(rbacUser, PERMISSIONS.SALES_EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const id = parseInt(params.id);
  const body = await request.json();
  const updated = await prisma.sales_rep_products.update({
    where: { id },
    data: {
      sales_rep_id: body.sales_rep_id,
      product_id: body.product_id,
      client_id: body.client_id,
      units_sold: body.units_sold,
      revenue_generated: body.revenue_generated,
      invoices_raised: body.invoices_raised,
      cash_collected: body.cash_collected,
      sale_date: body.sale_date ? new Date(body.sale_date) : undefined,
      invoice_date: body.invoice_date ? new Date(body.invoice_date) : undefined,
      cash_collection_date: body.cash_collection_date ? new Date(body.cash_collection_date) : undefined,
    },
    include: {
      sales_representatives: { select: { name: true } },
      products: { select: { name: true, price: true } },
      clients: { select: { name: true } },
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  if (!hasPermission(rbacUser, PERMISSIONS.SALES_DELETE)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const id = parseInt(params.id);
  await prisma.sales_rep_products.delete({ where: { id } });
  return NextResponse.json({ success: true });
} 