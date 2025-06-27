import { neon } from "@neondatabase/serverless"
import { PrismaClient } from '@prisma/client';

// Create a SQL client with the Neon connection string
export const sql = neon(
  process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    "",
)

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Add a function to check database connection
export async function checkDatabaseConnection() {
  try {
    const result = await sql`SELECT 1 as connected`
    return result[0]?.connected === 1
  } catch (error) {
    console.error("Database connection error:", error)
    return false
  }
}

// Type definitions for our database tables
export interface SalesRepresentative {
  id: number
  name: string
  email: string
  phone: string | null
  hire_date: string
  target_amount: number | null
  created_at: string
  image_url?: string | null
}

export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  created_at: string
  image_url?: string | null
}

export interface WeeklySalesReport {
  id: number
  sales_rep_id: number
  week_starting: string
  new_clients_targeted: number
  new_clients_added: number
  value_of_new_clients: number
  invoices_raised: number
  cash_collected: number
  key_wins: string | null
  blockers: string | null
  action_items: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: number
  name: string
  email: string
  phone: string | null
  company: string | null
  address: string | null
  sales_rep_id: number
  created_at: string
}

export interface Stakeholder {
  id: number
  client_id: number
  name: string
  email: string
  phone: string | null
  role: string | null
  created_at: string
}

export interface SalesRepProduct {
  id: number
  sales_rep_id: number
  product_id: number
  created_at: string
}

export interface LeadGeneration {
  id: number
  sales_rep_id: number
  month: string
  leads_generated: number
  leads_converted: number
  created_at: string
}

export interface FileRecord {
  id: number
  entity_type: string
  entity_id: number
  file_name: string
  file_url: string
  file_size: number
  created_at: string
}

export interface WeeklyReportProduct {
  id: number
  report_id: number
  product_id: number
  quantity_sold: number
  revenue: number
  created_at: string
}

// Sales Representatives Functions
export async function getAllSalesReps(): Promise<SalesRepresentative[]> {
  const salesReps = await sql<SalesRepresentative[]>`
    SELECT * FROM sales_representatives ORDER BY name ASC
  `
  return salesReps
}

export async function addSalesRep(
  name: string,
  email: string,
  phone: string | null,
  hire_date: string,
  target_amount: number | null,
): Promise<SalesRepresentative> {
  const [newSalesRep] = await sql<SalesRepresentative[]>`
    INSERT INTO sales_representatives (name, email, phone, hire_date, target_amount)
    VALUES (${name}, ${email}, ${phone}, ${hire_date}, ${target_amount})
    RETURNING *
  `
  return newSalesRep
}

export async function getSalesRepById(id: number): Promise<SalesRepresentative | null> {
  const [salesRep] = await sql<SalesRepresentative[]>`
    SELECT * FROM sales_representatives WHERE id = ${id}
  `
  return salesRep || null
}

export async function updateSalesRep(
  id: number,
  name: string,
  email: string,
  phone: string | null,
  hire_date: string,
  target_amount: number | null,
  image_url?: string | null,
): Promise<SalesRepresentative | null> {
  const [updatedSalesRep] = await sql<SalesRepresentative[]>`
    UPDATE sales_representatives
    SET 
      name = ${name},
      email = ${email},
      phone = ${phone},
      hire_date = ${hire_date},
      target_amount = ${target_amount},
      image_url = ${image_url}
    WHERE id = ${id}
    RETURNING *
  `
  return updatedSalesRep || null
}

export async function deleteSalesRep(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM sales_representatives
    WHERE id = ${id}
  `
  return result.count > 0
}

export async function getSalesRepProductsBySalesRepId(salesRepId: number): Promise<any[]> {
  const products = await sql`
    SELECT p.*, srp.created_at as assigned_at
    FROM products p
    JOIN sales_rep_products srp ON p.id = srp.product_id
    WHERE srp.sales_rep_id = ${salesRepId}
    ORDER BY p.name ASC
  `
  return products
}

export async function getProductSalesSummaryBySalesRep(salesRepId: number): Promise<any[]> {
  const summary = await sql`
    SELECT 
      p.name as product_name,
      SUM(wrp.quantity_sold) as total_quantity,
      SUM(wrp.revenue) as total_revenue
    FROM products p
    JOIN weekly_report_products wrp ON p.id = wrp.product_id
    JOIN weekly_sales_reports wsr ON wrp.report_id = wsr.id
    WHERE wsr.sales_rep_id = ${salesRepId}
    GROUP BY p.id, p.name
    ORDER BY total_revenue DESC
  `
  return summary
}

// Products Functions
export async function getAllProducts(): Promise<Product[]> {
  const products = await sql<Product[]>`
    SELECT * FROM products ORDER BY name ASC
  `
  return products
}

export async function addProduct(
  name: string,
  description: string | null,
  price: number,
  image_url?: string | null,
): Promise<Product> {
  const [newProduct] = await sql<Product[]>`
    INSERT INTO products (name, description, price, image_url)
    VALUES (${name}, ${description}, ${price}, ${image_url})
    RETURNING *
  `
  return newProduct
}

export async function getProductById(id: number): Promise<Product | null> {
  const [product] = await sql<Product[]>`
    SELECT * FROM products WHERE id = ${id}
  `
  return product || null
}

export async function updateProduct(
  id: number,
  name: string,
  description: string | null,
  price: number,
  image_url?: string | null,
): Promise<Product | null> {
  try {
    const existingProduct = await getProductById(id)
    if (!existingProduct) {
      return null
    }

    const finalImageUrl = image_url === undefined ? existingProduct.image_url : image_url

    const [updatedProduct] = await sql<Product[]>`
      UPDATE products
      SET 
        name = ${name},
        description = ${description},
        price = ${price},
        image_url = ${finalImageUrl}
      WHERE id = ${id}
      RETURNING *
    `

    return updatedProduct || null
  } catch (error) {
    console.error("Error in DB updateProduct:", error)
    throw error
  }
}

export async function deleteProduct(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM products
    WHERE id = ${id}
  `
  return result.count > 0
}

// Weekly Sales Reports Functions
export async function getAllWeeklySalesReports(): Promise<WeeklySalesReport[]> {
  const reports = await sql<WeeklySalesReport[]>`
    SELECT * FROM weekly_sales_reports 
    ORDER BY week_starting DESC
  `
  return reports
}

export async function getWeeklySalesReportsBySalesRep(salesRepId: number): Promise<WeeklySalesReport[]> {
  const reports = await sql<WeeklySalesReport[]>`
    SELECT * FROM weekly_sales_reports 
    WHERE sales_rep_id = ${salesRepId}
    ORDER BY week_starting DESC
  `
  return reports
}

export async function getWeeklyReportsBySalesRepId(salesRepId: number): Promise<WeeklySalesReport[]> {
  return getWeeklySalesReportsBySalesRep(salesRepId)
}

export async function getWeeklySalesReportById(id: number): Promise<WeeklySalesReport | null> {
  const [report] = await sql<WeeklySalesReport[]>`
    SELECT * FROM weekly_sales_reports WHERE id = ${id}
  `
  return report || null
}

export async function addWeeklySalesReport(
  sales_rep_id: number,
  week_starting: string,
  new_clients_targeted: number,
  new_clients_added: number,
  value_of_new_clients: number,
  invoices_raised: number,
  cash_collected: number,
  key_wins: string | null,
  blockers: string | null,
  action_items: string | null,
): Promise<WeeklySalesReport> {
  const [newReport] = await sql<WeeklySalesReport[]>`
    INSERT INTO weekly_sales_reports (
      sales_rep_id, 
      week_starting, 
      new_clients_targeted, 
      new_clients_added, 
      value_of_new_clients, 
      invoices_raised, 
      cash_collected, 
      key_wins, 
      blockers, 
      action_items
    )
    VALUES (
      ${sales_rep_id}, 
      ${week_starting}, 
      ${new_clients_targeted}, 
      ${new_clients_added}, 
      ${value_of_new_clients}, 
      ${invoices_raised}, 
      ${cash_collected}, 
      ${key_wins}, 
      ${blockers}, 
      ${action_items}
    )
    RETURNING *
  `
  return newReport
}

export async function updateWeeklySalesReport(
  id: number,
  new_clients_targeted: number,
  new_clients_added: number,
  value_of_new_clients: number,
  invoices_raised: number,
  cash_collected: number,
  key_wins: string | null,
  blockers: string | null,
  action_items: string | null,
): Promise<WeeklySalesReport | null> {
  const [updatedReport] = await sql<WeeklySalesReport[]>`
    UPDATE weekly_sales_reports
    SET 
      new_clients_targeted = ${new_clients_targeted},
      new_clients_added = ${new_clients_added},
      value_of_new_clients = ${value_of_new_clients},
      invoices_raised = ${invoices_raised},
      cash_collected = ${cash_collected},
      key_wins = ${key_wins},
      blockers = ${blockers},
      action_items = ${action_items},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `
  return updatedReport || null
}

export async function deleteWeeklySalesReport(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM weekly_sales_reports
    WHERE id = ${id}
  `
  return result.count > 0
}

export async function getWeeklySalesReportByWeekAndSalesRep(
  sales_rep_id: number,
  week_starting: string,
): Promise<WeeklySalesReport | null> {
  const [report] = await sql<WeeklySalesReport[]>`
    SELECT * FROM weekly_sales_reports 
    WHERE sales_rep_id = ${sales_rep_id} AND week_starting = ${week_starting}
  `
  return report || null
}

// Clients Functions
export async function getAllClients(): Promise<Client[]> {
  const clients = await sql<Client[]>`
    SELECT c.*, sr.name as sales_rep_name
    FROM clients c
    LEFT JOIN sales_representatives sr ON c.sales_rep_id = sr.id
    ORDER BY c.name ASC
  `
  return clients
}

export async function getClientById(id: number): Promise<Client | null> {
  const [client] = await sql<Client[]>`
    SELECT c.*, sr.name as sales_rep_name
    FROM clients c
    LEFT JOIN sales_representatives sr ON c.sales_rep_id = sr.id
    WHERE c.id = ${id}
  `
  return client || null
}

export async function addClient(
  name: string,
  email: string,
  phone: string | null,
  company: string | null,
  address: string | null,
  sales_rep_id: number,
): Promise<Client> {
  const [newClient] = await sql<Client[]>`
    INSERT INTO clients (name, email, phone, company, address, sales_rep_id)
    VALUES (${name}, ${email}, ${phone}, ${company}, ${address}, ${sales_rep_id})
    RETURNING *
  `
  return newClient
}

export async function updateClient(
  id: number,
  name: string,
  email: string,
  phone: string | null,
  company: string | null,
  address: string | null,
  sales_rep_id: number,
): Promise<Client | null> {
  const [updatedClient] = await sql<Client[]>`
    UPDATE clients
    SET 
      name = ${name},
      email = ${email},
      phone = ${phone},
      company = ${company},
      address = ${address},
      sales_rep_id = ${sales_rep_id}
    WHERE id = ${id}
    RETURNING *
  `
  return updatedClient || null
}

export async function deleteClient(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM clients
    WHERE id = ${id}
  `
  return result.count > 0
}

export async function getClientStatistics(): Promise<any> {
  const [stats] = await sql`
    SELECT 
      COUNT(*) as total_clients,
      COUNT(DISTINCT sales_rep_id) as active_sales_reps
    FROM clients
  `
  return stats
}

// Add this safe version for client statistics
export async function getClientStatisticsSafe() {
  try {
    const [stats] = await sql`
      SELECT
        COUNT(*) as total_clients,
        COUNT(CASE WHEN sales_stage = 'Lead' THEN 1 END) as leads_count,
        COUNT(CASE WHEN sales_stage = 'Qualified' THEN 1 END) as qualified_count,
        COUNT(CASE WHEN sales_stage = 'Demo' THEN 1 END) as demo_count,
        COUNT(CASE WHEN sales_stage = 'Proposal Sent' THEN 1 END) as proposal_count,
        COUNT(CASE WHEN sales_stage = 'Negotiation' THEN 1 END) as negotiation_count,
        COUNT(CASE WHEN sales_stage = 'Closed' THEN 1 END) as closed_count,
        SUM(CASE WHEN sales_stage = 'Closed' THEN COALESCE(deal_value, 0) ELSE 0 END) as closed_value,
        SUM(COALESCE(deal_value, 0) * COALESCE(probability_to_close, 0) / 100) as weighted_pipeline
      FROM clients
    `
    return stats
  } catch (error) {
    console.error("Error fetching client statistics:", error)
    return {
      total_clients: 0,
      leads_count: 0,
      qualified_count: 0,
      demo_count: 0,
      proposal_count: 0,
      negotiation_count: 0,
      closed_count: 0,
      closed_value: 0,
      weighted_pipeline: 0,
    }
  }
}

// Stakeholders Functions
export async function getStakeholdersByClientId(clientId: number): Promise<Stakeholder[]> {
  const stakeholders = await sql<Stakeholder[]>`
    SELECT * FROM stakeholders 
    WHERE client_id = ${clientId}
    ORDER BY name ASC
  `
  return stakeholders
}

export async function addStakeholder(
  client_id: number,
  name: string,
  email: string,
  phone: string | null,
  role: string | null,
): Promise<Stakeholder> {
  const [newStakeholder] = await sql<Stakeholder[]>`
    INSERT INTO stakeholders (client_id, name, email, phone, role)
    VALUES (${client_id}, ${name}, ${email}, ${phone}, ${role})
    RETURNING *
  `
  return newStakeholder
}

export async function deleteStakeholder(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM stakeholders
    WHERE id = ${id}
  `
  return result.count > 0
}

// Sales Rep Products Functions
export async function addSalesRepProduct(sales_rep_id: number, product_id: number): Promise<SalesRepProduct> {
  const [newSalesRepProduct] = await sql<SalesRepProduct[]>`
    INSERT INTO sales_rep_products (sales_rep_id, product_id)
    VALUES (${sales_rep_id}, ${product_id})
    RETURNING *
  `
  return newSalesRepProduct
}

// Lead Generation Functions
export async function addLeadGenerationData(
  sales_rep_id: number,
  month: string,
  leads_generated: number,
  leads_converted: number,
): Promise<LeadGeneration> {
  const [newLeadData] = await sql<LeadGeneration[]>`
    INSERT INTO lead_generation (sales_rep_id, month, leads_generated, leads_converted)
    VALUES (${sales_rep_id}, ${month}, ${leads_generated}, ${leads_converted})
    RETURNING *
  `
  return newLeadData
}

export async function updateLeadGenerationData(
  id: number,
  leads_generated: number,
  leads_converted: number,
): Promise<LeadGeneration | null> {
  const [updatedLeadData] = await sql<LeadGeneration[]>`
    UPDATE lead_generation
    SET 
      leads_generated = ${leads_generated},
      leads_converted = ${leads_converted}
    WHERE id = ${id}
    RETURNING *
  `
  return updatedLeadData || null
}

export async function deleteLeadGenerationData(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM lead_generation
    WHERE id = ${id}
  `
  return result.count > 0
}

// File Functions
export async function getFilesByEntity(entityType: string, entityId: number): Promise<FileRecord[]> {
  const files = await sql<FileRecord[]>`
    SELECT * FROM files 
    WHERE entity_type = ${entityType} AND entity_id = ${entityId}
    ORDER BY created_at DESC
  `
  return files
}

export async function addFileRecord(
  entity_type: string,
  entity_id: number,
  file_name: string,
  file_url: string,
  file_size: number,
): Promise<FileRecord> {
  const [newFileRecord] = await sql<FileRecord[]>`
    INSERT INTO files (entity_type, entity_id, file_name, file_url, file_size)
    VALUES (${entity_type}, ${entity_id}, ${file_name}, ${file_url}, ${file_size})
    RETURNING *
  `
  return newFileRecord
}

export async function updateFileRecord(id: number, file_name: string): Promise<FileRecord | null> {
  const [updatedFileRecord] = await sql<FileRecord[]>`
    UPDATE files
    SET file_name = ${file_name}
    WHERE id = ${id}
    RETURNING *
  `
  return updatedFileRecord || null
}

export async function deleteFileRecord(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM files
    WHERE id = ${id}
  `
  return result.count > 0
}

// Weekly Report Products Functions
export async function addWeeklyReportProduct(
  report_id: number,
  product_id: number,
  quantity_sold: number,
  revenue: number,
): Promise<WeeklyReportProduct> {
  const [newReportProduct] = await sql<WeeklyReportProduct[]>`
    INSERT INTO weekly_report_products (report_id, product_id, quantity_sold, revenue)
    VALUES (${report_id}, ${product_id}, ${quantity_sold}, ${revenue})
    RETURNING *
  `
  return newReportProduct
}

export async function updateWeeklyReportProduct(
  id: number,
  quantity_sold: number,
  revenue: number,
): Promise<WeeklyReportProduct | null> {
  const [updatedReportProduct] = await sql<WeeklyReportProduct[]>`
    UPDATE weekly_report_products
    SET 
      quantity_sold = ${quantity_sold},
      revenue = ${revenue}
    WHERE id = ${id}
    RETURNING *
  `
  return updatedReportProduct || null
}

export async function deleteWeeklyReportProduct(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM weekly_report_products
    WHERE id = ${id}
  `
  return result.count > 0
}
