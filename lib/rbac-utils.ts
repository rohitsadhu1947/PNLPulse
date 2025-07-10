import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission, PERMISSIONS, RBACUser } from '@/lib/rbac';
import { prisma } from '@/lib/db';

export type ExtendedSessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: string[];
  permissions?: string[];
};

/**
 * Get RBAC user from session
 */
export async function getRBACUser(): Promise<RBACUser | undefined> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return undefined;
  
  const user = session.user as ExtendedSessionUser;
  return user ? { 
    id: user.id ?? '', 
    roles: user.roles, 
    permissions: user.permissions 
  } : undefined;
}

/**
 * Check if user has permission, throw error if not
 */
export async function requirePermission(permission: string): Promise<RBACUser> {
  const rbacUser = await getRBACUser();
  if (!rbacUser || !hasPermission(rbacUser, permission)) {
    throw new Error('Forbidden');
  }
  return rbacUser;
}

/**
 * Check if user is a sales rep
 */
export function isSalesRep(rbacUser: RBACUser | undefined): boolean {
  return rbacUser?.roles?.includes('sales_rep') || false;
}

/**
 * Check if user is admin or sales manager
 */
export function isAdminOrManager(rbacUser: RBACUser | undefined): boolean {
  return rbacUser?.roles?.some(role => ['admin', 'sales_manager'].includes(role)) || false;
}

/**
 * Get current user's sales rep ID
 */
export async function getCurrentSalesRepId(userId: string): Promise<number | null> {
  const currentUser = await prisma.users.findUnique({
    where: { id: parseInt(userId) }
  });
  
  if (!currentUser) return null;
  
  const salesRep = await prisma.sales_representatives.findFirst({
    where: { email: currentUser.email }
  });
  
  return salesRep?.id || null;
}

/**
 * Check if sales rep can edit their own profile only
 */
export async function canEditSalesRepProfile(
  rbacUser: RBACUser | undefined, 
  targetSalesRepId: number
): Promise<boolean> {
  if (!rbacUser) return false;
  
  // Admin/manager can edit any sales rep
  if (isAdminOrManager(rbacUser)) return true;
  
  // Sales rep can only edit their own profile
  if (isSalesRep(rbacUser)) {
    const currentSalesRepId = await getCurrentSalesRepId(String(rbacUser.id));
    return currentSalesRepId === targetSalesRepId;
  }
  
  return false;
}

/**
 * Check if sales rep can edit client (must be assigned to client)
 */
export async function canEditClient(
  rbacUser: RBACUser | undefined, 
  clientId: number
): Promise<boolean> {
  if (!rbacUser) return false;
  
  // Admin/manager can edit any client
  if (isAdminOrManager(rbacUser)) return true;
  
  // Sales rep can only edit clients they're assigned to
  if (isSalesRep(rbacUser)) {
    const currentSalesRepId = await getCurrentSalesRepId(String(rbacUser.id));
    if (!currentSalesRepId) return false;
    
    const client = await prisma.clients.findUnique({
      where: { id: clientId },
      include: {
        sales_representatives: true
      }
    });
    
    if (!client || !client.sales_representatives || !Array.isArray(client.sales_representatives)) {
      return false;
    }
    
    return client.sales_representatives.some((sr: any) => sr.id === currentSalesRepId);
  }
  
  return false;
}

/**
 * Check if sales rep can edit stakeholder (must be assigned to stakeholder's client)
 */
export async function canEditStakeholder(
  rbacUser: RBACUser | undefined, 
  stakeholderId: number
): Promise<boolean> {
  if (!rbacUser) return false;
  
  // Admin/manager can edit any stakeholder
  if (isAdminOrManager(rbacUser)) return true;
  
  // Sales rep can only edit stakeholders of clients they're assigned to
  if (isSalesRep(rbacUser)) {
    const currentSalesRepId = await getCurrentSalesRepId(String(rbacUser.id));
    if (!currentSalesRepId) return false;
    
    const stakeholder = await prisma.stakeholders.findUnique({
      where: { id: stakeholderId },
      include: {
        clients: {
          include: {
            sales_representatives: true
          }
        }
      }
    });
    
    if (!stakeholder?.clients?.sales_representatives || !Array.isArray(stakeholder.clients.sales_representatives)) {
      return false;
    }
    
    return stakeholder.clients.sales_representatives.some((sr: any) => sr.id === currentSalesRepId);
  }
  
  return false;
} 