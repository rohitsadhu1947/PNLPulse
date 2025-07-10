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

// Helper function to get or create sales_representatives record
async function getOrCreateSalesRepresentative(userId: number) {
  // Get user data first
  const user = await prisma.users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if a sales_representatives record already exists by email
  let salesRep = await prisma.sales_representatives.findUnique({
    where: { email: user.email }
  });

  if (!salesRep) {
    // Create sales_representatives record with default values
    salesRep = await prisma.sales_representatives.create({
      data: {
        name: user.name,
        email: user.email,
        phone: null,
        hire_date: new Date(),
        target_amount: null,
      }
    });
  }

  return salesRep;
}

// GET /api/sales - List all sales records
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  
  // Allow access if user has the permission OR if they are a sales rep
  const hasViewPermission = hasPermission(rbacUser, PERMISSIONS.SALES_VIEW) || 
                           hasPermission(rbacUser, 'sales:read') ||
                           rbacUser?.roles?.includes('sales_rep');
  
  if (!hasViewPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    console.log('Fetching sales records...');
    
    // First, let's check what's in the sales_representatives table
    const salesReps = await prisma.sales_representatives.findMany();
    console.log('All sales_representatives:', salesReps);
    
    // Check what's in the products table
    const products = await prisma.products.findMany();
    console.log('All products:', products);
    
    // Check what's in the clients table
    const clients = await prisma.clients.findMany();
    console.log('All clients:', clients);
    
    const salesRecords = await prisma.sales_rep_products.findMany({
      include: {
        sales_representatives: {
          select: {
            name: true,
          },
        },
        products: {
          select: {
            name: true,
            price: true,
          },
        },
        clients: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        sale_date: 'desc',
      },
    });

    console.log('Raw sales records from DB:', salesRecords);
    console.log('Number of sales records found:', salesRecords.length);

    return NextResponse.json({ salesRecords }, { status: 200 });
  } catch (error) {
    console.error('Error fetching sales records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create new sales record
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as ExtendedSessionUser | undefined;
  const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
  
  // Allow access if user has the permission OR if they are a sales rep
  const hasCreatePermission = hasPermission(rbacUser, PERMISSIONS.SALES_CREATE) || 
                             hasPermission(rbacUser, 'sales:write') ||
                             rbacUser?.roles?.includes('sales_rep');
  
  if (!hasCreatePermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    // Validate required fields
    if (!body.sales_rep_id || !body.product_id || !body.client_id || !body.sale_date) {
      return NextResponse.json(
        { error: 'Missing required fields: sales_rep_id, product_id, client_id, sale_date' },
        { status: 400 }
      );
    }
    // Validate numeric fields
    const units_sold = parseInt(body.units_sold) || 0;
    const revenue_generated = parseFloat(body.revenue_generated) || 0;
    const invoices_raised = parseFloat(body.invoices_raised) || 0;
    const cash_collected = parseFloat(body.cash_collected) || 0;
    if (units_sold < 0 || revenue_generated < 0 || invoices_raised < 0 || cash_collected < 0) {
      return NextResponse.json(
        { error: 'Numeric fields must be non-negative' },
        { status: 400 }
      );
    }
    // Use sales_rep_id directly
    const salesRecord = await prisma.sales_rep_products.create({
      data: {
        sales_rep_id: body.sales_rep_id,
        product_id: body.product_id,
        client_id: body.client_id,
        units_sold,
        revenue_generated,
        invoices_raised,
        cash_collected,
        sale_date: new Date(body.sale_date),
        invoice_date: body.invoice_date ? new Date(body.invoice_date) : null,
        cash_collection_date: body.cash_collection_date ? new Date(body.cash_collection_date) : null,
      },
      include: {
        sales_representatives: {
          select: {
            name: true,
          },
        },
        products: {
          select: {
            name: true,
            price: true,
          },
        },
        clients: {
          select: {
            name: true,
          },
        },
      },
    });
    return NextResponse.json(salesRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating sales record:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 