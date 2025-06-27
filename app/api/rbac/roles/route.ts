import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasRole, PERMISSIONS } from '@/lib/rbac';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('Roles API - Session:', session);
    
    if (!session?.user?.email) {
      console.log('Roles API - No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has role management permissions
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      include: {
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: true
          }
        }
      }
    });

    console.log('Roles API - User from database:', user);

    if (!user) {
      console.log('Roles API - User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoles = user.user_roles_user_roles_user_idTousers
      .map((ur: any) => ur.roles?.name)
      .filter(Boolean);
    
    console.log('Roles API - User roles:', userRoles);
    
    // Check if user has role management permissions
    if (!hasRole({ id: user.id, roles: userRoles }, ['admin'])) {
      console.log('Roles API - User does not have admin role');
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const roles = await prisma.roles.findMany({
      orderBy: { name: 'asc' }
    });

    console.log('Roles API - Roles from database:', roles);

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Roles API - Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has role management permissions
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      include: {
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoles = user.user_roles_user_roles_user_idTousers
      .map((ur: any) => ur.roles?.name)
      .filter(Boolean);
    
    // Check if user has role management permissions
    if (!hasRole({ id: user.id, roles: userRoles }, ['admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, permissions = [] } = body;

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    // Check if role already exists
    const existingRole = await prisma.roles.findUnique({
      where: { name }
    });

    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }

    // Validate permissions
    const validPermissions = Object.values(PERMISSIONS);
    const invalidPermissions = permissions.filter((p: string) => !validPermissions.includes(p as any));
    
    if (invalidPermissions.length > 0) {
      return NextResponse.json({ 
        error: `Invalid permissions: ${invalidPermissions.join(', ')}` 
      }, { status: 400 });
    }

    const role = await prisma.roles.create({
      data: {
        name,
        description,
        permissions: permissions
      }
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has role management permissions
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      include: {
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoles = user.user_roles_user_roles_user_idTousers
      .map((ur: any) => ur.roles?.name)
      .filter(Boolean);
    
    // Check if user has role management permissions
    if (!hasRole({ id: user.id, roles: userRoles }, ['admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, permissions } = body;

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Check if role exists
    const existingRole = await prisma.roles.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Validate permissions if provided
    if (permissions) {
      const validPermissions = Object.values(PERMISSIONS);
      const invalidPermissions = permissions.filter((p: string) => !validPermissions.includes(p as any));
      
      if (invalidPermissions.length > 0) {
        return NextResponse.json({ 
          error: `Invalid permissions: ${invalidPermissions.join(', ')}` 
        }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;

    const role = await prisma.roles.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has role management permissions
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      include: {
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRoles = user.user_roles_user_roles_user_idTousers
      .map((ur: any) => ur.roles?.name)
      .filter(Boolean);
    
    // Check if user has role management permissions
    if (!hasRole({ id: user.id, roles: userRoles }, ['admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Check if role exists
    const existingRole = await prisma.roles.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if role is assigned to any users
    const userRolesWithRole = await prisma.user_roles.findMany({
      where: { role_id: parseInt(id) }
    });

    if (userRolesWithRole.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete role that is assigned to users. Please remove role assignments first.' 
      }, { status: 400 });
    }

    await prisma.roles.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 