import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getAllProducts, addProduct as dbAddProduct } from '@/lib/db';
import { prisma } from '@/lib/db';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    // Optionally, add RBAC here if needed
    const products = await getAllProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as any;
    const rbacUser = user ? { id: user.id ?? '', roles: user.roles, permissions: user.permissions } : undefined;
    if (!hasPermission(rbacUser, PERMISSIONS.PRODUCTS_CREATE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }
    const price = typeof body.price === 'string' ? parseFloat(body.price) : body.price;
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: 'Product price must be a valid non-negative number' },
        { status: 400 }
      );
    }
    let annual_sales_target = 0;
    if (body.annual_sales_target !== undefined) {
      annual_sales_target = typeof body.annual_sales_target === 'string' ? parseFloat(body.annual_sales_target) : body.annual_sales_target;
      if (isNaN(annual_sales_target) || annual_sales_target < 0) {
        return NextResponse.json(
          { error: 'Annual sales target must be a valid non-negative number' },
          { status: 400 }
        );
      }
    }
    const product = await prisma.products.create({
      data: {
        name: body.name.trim(),
        description: body.description || null,
        price,
        annual_sales_target,
      },
    });
    // Optionally, add audit log here
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 