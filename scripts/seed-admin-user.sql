-- Check if users table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        -- Check if admin user already exists
        IF NOT EXISTS (
            SELECT FROM users WHERE email = 'admin@company.com'
        ) THEN
            -- Insert admin user
            INSERT INTO users (name, email, password, role)
            VALUES ('Admin User', 'admin@company.com', 'password123', 'admin');
        END IF;
    END IF;
END
$$;
