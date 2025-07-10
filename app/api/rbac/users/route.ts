import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hasRole } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }
    
    const user = session?.user as import('@/lib/rbac').RBACUser | undefined;
    console.log('User from session:', user);
    
    if (!hasRole({
      id: user?.id || '',
      roles: user?.roles || [],
      permissions: user?.permissions || []
    }, ['admin', 'super_admin'])) {
      console.log('User does not have admin role. User roles:', user?.roles);
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        user_roles_user_roles_user_idTousers: {
          select: {
            roles: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });
    
    console.log('Raw users from database:', users);
    
    // Transform the data to flatten the roles structure
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.user_roles_user_roles_user_idTousers
        .map(ur => ur.roles)
        .filter(Boolean)
    }));
    
    console.log('Transformed users:', transformedUsers);
    
    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Error in GET /api/rbac/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as import('@/lib/rbac').RBACUser | undefined;
    if (!hasRole({
      id: user?.id || '',
      roles: user?.roles || [],
      permissions: user?.permissions || []
    }, ['admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    // If creating a new user
    if (body.name && body.email && body.password) {
      // Check if user already exists
      const existing = await prisma.users.findUnique({ where: { email: body.email } });
      if (existing) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
      }
      // Hash password (simple hash for now, replace with bcrypt in production)
      const hashedPassword = bcrypt.hashSync(body.password, 10);
      const newUser = await prisma.users.create({
        data: {
          name: body.name,
          email: body.email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
        }
      });
      return NextResponse.json(newUser, { status: 201 });
    }
    // If assigning a role to a user
    if (body.user_id && body.role_id) {
      // Prevent assigning 'sales_rep' role via this endpoint
      const role = await prisma.roles.findUnique({ where: { id: parseInt(body.role_id, 10) } });
      if (role?.name === 'sales_rep') {
        return NextResponse.json({ error: 'Cannot assign Sales Rep role via this interface.' }, { status: 400 });
      }
      // Check if user already has this role
      const existing = await prisma.user_roles.findUnique({
        where: {
          user_id_role_id: {
            user_id: parseInt(body.user_id, 10),
            role_id: parseInt(body.role_id, 10),
          },
        },
      });
      if (existing) {
        return NextResponse.json({ error: 'User already has this role.' }, { status: 400 });
      }
      const userRole = await prisma.user_roles.create({
        data: {
          user_id: parseInt(body.user_id, 10),
          role_id: parseInt(body.role_id, 10),
        },
      });
      return NextResponse.json(userRole, { status: 201 });
    }
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in users POST:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as import('@/lib/rbac').RBACUser | undefined;
    if (!hasRole({
      id: user?.id || '',
      roles: user?.roles || [],
      permissions: user?.permissions || []
    }, ['admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    if (!body.user_id || !body.role_id) {
      return NextResponse.json({ error: 'user_id and role_id are required' }, { status: 400 });
    }
    await prisma.user_roles.deleteMany({
      where: {
        user_id: parseInt(body.user_id, 10),
        role_id: parseInt(body.role_id, 10),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing role:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
