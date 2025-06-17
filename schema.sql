-- Create a table to store file information
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'sales_rep', 'product', 'weekly_report'
  entity_id INTEGER NOT NULL,
  description TEXT,
  uploaded_by INTEGER REFERENCES sales_representatives(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_files_entity_type_entity_id ON files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
