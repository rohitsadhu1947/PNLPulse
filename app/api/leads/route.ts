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
    const leadHandovers = await prisma.sales_lead_generation.findMany({
      include: {
        sales_representatives_sales_lead_generation_generator_idTosales_representatives: {
          select: { name: true }
        },
        sales_representatives_sales_lead_generation_recipient_idTosales_representatives: {
          select: { name: true }
        },
        client: {
          select: { id: true, name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Transform the data to match the frontend interface
    const transformedData = leadHandovers.map(handover => ({
      id: handover.id,
      generator_id: handover.generator_id,
      recipient_id: handover.recipient_id,
      client_id: handover.client_id,
      leads_generated: handover.leads_generated,
      leads_converted: handover.leads_converted,
      value_of_converted_leads: handover.value_of_converted_leads,
      commission_percentage: handover.commission_percentage,
      commission_amount: handover.commission_amount,
      created_at: handover.created_at,
      generator: handover.sales_representatives_sales_lead_generation_generator_idTosales_representatives,
      recipient: handover.sales_representatives_sales_lead_generation_recipient_idTosales_representatives,
      client: handover.client
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching lead handovers:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
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
    
    // Validate required fields
    const requiredFields = ['generator_id', 'recipient_id', 'client_id', 'leads_generated', 'leads_converted', 'value_of_converted_leads', 'commission_percentage'];
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Additional validation for value ranges
    if (body.value_of_converted_leads < 0 || body.value_of_converted_leads > 1_000_000_000) {
      return NextResponse.json({ error: 'Value of converted leads must be between 0 and 1,000,000,000' }, { status: 400 });
    }
    if (body.commission_percentage < 0 || body.commission_percentage > 100) {
      return NextResponse.json({ error: 'Commission percentage must be between 0 and 100' }, { status: 400 });
    }
    if (body.leads_generated < 0 || body.leads_generated > 10000) {
      return NextResponse.json({ error: 'Leads generated must be between 0 and 10,000' }, { status: 400 });
    }
    if (body.leads_converted < 0 || body.leads_converted > 10000) {
      return NextResponse.json({ error: 'Leads converted must be between 0 and 10,000' }, { status: 400 });
    }

    // Validate that generator_id, recipient_id, and client_id exist
    const [generator, recipient, client] = await Promise.all([
      prisma.sales_representatives.findUnique({
        where: { id: body.generator_id }
      }),
      prisma.sales_representatives.findUnique({
        where: { id: body.recipient_id }
      }),
      prisma.clients.findUnique({
        where: { id: body.client_id }
      })
    ]);

    if (!generator) {
      return NextResponse.json({ error: `Generator with ID ${body.generator_id} not found` }, { status: 400 });
    }
    if (!recipient) {
      return NextResponse.json({ error: `Recipient with ID ${body.recipient_id} not found` }, { status: 400 });
    }
    if (!client) {
      return NextResponse.json({ error: `Client with ID ${body.client_id} not found` }, { status: 400 });
    }

    // Calculate commission amount
    const commissionAmount = (body.value_of_converted_leads * body.commission_percentage) / 100;

    const leadHandover = await prisma.sales_lead_generation.create({
      data: {
        generator_id: body.generator_id ? Number(body.generator_id) : null,
        recipient_id: body.recipient_id ? Number(body.recipient_id) : null,
        client_id: body.client_id ? Number(body.client_id) : null,
        leads_generated: Number(body.leads_generated),
        leads_converted: Number(body.leads_converted),
        value_of_converted_leads: Number(body.value_of_converted_leads),
        commission_percentage: Number(body.commission_percentage),
        commission_amount: commissionAmount
      },
      include: {
        sales_representatives_sales_lead_generation_generator_idTosales_representatives: {
          select: { name: true }
        },
        sales_representatives_sales_lead_generation_recipient_idTosales_representatives: {
          select: { name: true }
        },
        client: {
          select: { id: true, name: true }
        }
      }
    });

    // Transform the response to match the frontend interface
    const transformedData = {
      id: leadHandover.id,
      generator_id: leadHandover.generator_id,
      recipient_id: leadHandover.recipient_id,
      client_id: leadHandover.client_id,
      leads_generated: leadHandover.leads_generated,
      leads_converted: leadHandover.leads_converted,
      value_of_converted_leads: leadHandover.value_of_converted_leads,
      commission_percentage: leadHandover.commission_percentage,
      commission_amount: leadHandover.commission_amount,
      created_at: leadHandover.created_at,
      generator: leadHandover.sales_representatives_sales_lead_generation_generator_idTosales_representatives,
      recipient: leadHandover.sales_representatives_sales_lead_generation_recipient_idTosales_representatives,
      client: leadHandover.client
    };

    return NextResponse.json(transformedData, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lead handover:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Invalid sales representative ID. Please ensure both generator and recipient are valid sales representatives.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 