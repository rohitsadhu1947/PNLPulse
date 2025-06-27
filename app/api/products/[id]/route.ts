import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// GET /api/products/[id] - Get single product
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.products.findUnique({
      where: { id: parseInt(params.id) },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const updatedProduct = await prisma.products.update({
      where: { id: parseInt(params.id) },
      data: {
        name: body.name.trim(),
        description: body.description || null,
        price,
        annual_sales_target,
      },
    });
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await prisma.products.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 