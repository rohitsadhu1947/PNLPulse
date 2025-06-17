-- Authentication Tables Migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Update existing users to be active
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('super_admin', 'Super Administrator', '["*"]'),
('admin', 'Administrator', '["users:read", "users:write", "sales_reps:read", "sales_reps:write", "products:read", "products:write", "clients:read", "clients:write", "reports:read", "reports:write", "dashboard:read", "admin:settings"]'),
('sales_manager', 'Sales Manager', '["sales_reps:read", "products:read", "clients:read", "clients:write", "reports:read", "reports:write", "dashboard:read"]'),
('sales_rep', 'Sales Representative', '["sales_reps:read", "products:read", "clients:read", "clients:write", "reports:read", "own_reports:write", "dashboard:read"]'),
('viewer', 'Read Only User', '["sales_reps:read", "products:read", "clients:read", "reports:read", "dashboard:read"]')
ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Create default admin user (password is 'password123')
INSERT INTO users (name, email, password, is_active)
VALUES ('System Administrator', 'admin@company.com', '$2a$12$LQv3c1yqBwW2uDc5wPdavu9CtFNdCG.zwZJeWZEWwz4bHl3fZ3YGu', true)
ON CONFLICT (email) DO NOTHING;

-- Assign admin role to default user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'admin@company.com' AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;
