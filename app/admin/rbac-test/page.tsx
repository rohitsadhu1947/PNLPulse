"use client";
import { useEffect, useState } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PERMISSIONS, getPermissionsByCategory } from '@/lib/rbac';

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  user_roles_user_roles_user_idTousers?: any[];
}

export default function RBACTestPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Role creation/editing state
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // User role assignment state
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const permissionsByCategory = getPermissionsByCategory();

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/rbac/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data.roles || []);
    } catch (error) {
      setError('Failed to fetch roles');
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/rbac/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      // The API now returns users with a flattened roles array
      setUsers(data || []);
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/rbac/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName,
          description: roleDescription,
          permissions: selectedPermissions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create role');
      }

      setSuccess('Role created successfully');
      resetRoleForm();
      fetchRoles();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const response = await fetch('/api/rbac/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRole.id,
          name: roleName,
          description: roleDescription,
          permissions: selectedPermissions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      setSuccess('Role updated successfully');
      resetRoleForm();
      fetchRoles();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch(`/api/rbac/roles?id=${roleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete role');
      }

      setSuccess('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete role');
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      setError('Please select both user and role');
      return;
    }

    try {
      const response = await fetch('/api/rbac/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser,
          role_id: selectedRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign role');
      }

      setSuccess('Role assigned successfully');
      setSelectedUser('');
      setSelectedRole('');
      fetchUsers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    console.log('Removing role:', { userId, roleId });
    try {
      const response = await fetch('/api/rbac/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role_id: roleId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove role');
      }

      setSuccess('Role removed successfully');
      fetchUsers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove role');
      console.error('Remove role error:', error);
    }
  };

  const resetRoleForm = () => {
    setShowRoleForm(false);
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
  };

  const editRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions || []);
    setShowRoleForm(true);
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(Object.values(PERMISSIONS));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">RBAC Management</h1>
        <Button onClick={() => setShowRoleForm(true)}>Create New Role</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Role Creation/Editing Form */}
      {showRoleForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</CardTitle>
            <CardDescription>
              {editingRole ? 'Update role details and permissions' : 'Create a new role with specific permissions'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., sales_manager"
                />
              </div>
              <div>
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Role description"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Permissions</Label>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllPermissions}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllPermissions}>
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-600">{category}</h4>
                    {permissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={selectedPermissions.includes(permission.value)}
                          onCheckedChange={() => togglePermission(permission.value)}
                        />
                        <Label htmlFor={permission.value} className="text-sm">
                          {permission.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={editingRole ? handleUpdateRole : handleCreateRole}>
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
              <Button variant="outline" onClick={resetRoleForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Manage system roles and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{role.name}</h3>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => editRole(role)}>
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <h4 className="text-sm font-medium mb-2">Permissions:</h4>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions && role.permissions.length > 0 ? (
                      role.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No permissions assigned</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Roles to Users</CardTitle>
          <CardDescription>Assign or remove roles from users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="userSelect">User</Label>
              <select
                id="userSelect"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="roleSelect">Role</Label>
              <select
                id="roleSelect"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAssignRole} className="w-full">
                Assign Role
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Current User Roles:</h4>
            {users.map((user) => (
              <div key={user.id} className="border rounded-lg p-4">
                <h5 className="font-semibold">{user.name} ({user.email})</h5>
                <div className="mt-2">
                  {user.roles && user.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role: any) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-gray-200 rounded text-xs">{role.name}</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveRole(user.id.toString(), role.id.toString())}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No roles assigned</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 