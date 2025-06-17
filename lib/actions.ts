"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  addSalesRep as dbAddSalesRep,
  updateSalesRep as dbUpdateSalesRep,
  deleteSalesRep as dbDeleteSalesRep,
  addProduct as dbAddProduct,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  addWeeklySalesReport as dbAddWeeklySalesReport,
  updateWeeklySalesReport as dbUpdateWeeklySalesReport,
  deleteWeeklySalesReport as dbDeleteWeeklySalesReport,
  addClient as dbAddClient,
  updateClient as dbUpdateClient,
  deleteClient as dbDeleteClient,
  addStakeholder as dbAddStakeholder,
  deleteStakeholder as dbDeleteStakeholder,
  addSalesRepProduct as dbAddSalesRepProduct,
  addLeadGenerationData as dbAddLeadGenerationData,
  updateLeadGenerationData as dbUpdateLeadGenerationData,
  deleteLeadGenerationData as dbDeleteLeadGenerationData,
  addFileRecord as dbAddFileRecord,
  updateFileRecord as dbUpdateFileRecord,
  deleteFileRecord as dbDeleteFileRecord,
  addWeeklyReportProduct as dbAddWeeklyReportProduct,
  updateWeeklyReportProduct as dbUpdateWeeklyReportProduct,
  deleteWeeklyReportProduct as dbDeleteWeeklyReportProduct,
} from "./db"
import { getCurrentUser, logAction } from "./auth"

// Sales Rep Actions
export async function addSalesRep(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const hire_date = formData.get("hire_date") as string
  const target_amount = Number.parseFloat(formData.get("target_amount") as string) || null

  const salesRep = await dbAddSalesRep(name, email, phone, hire_date, target_amount)

  await logAction(user.id, "CREATE", "sales_representatives", salesRep.id, null, salesRep)

  revalidatePath("/sales-reps")
  redirect("/sales-reps")
}

export async function updateSalesRep(id: number, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const hire_date = formData.get("hire_date") as string
  const target_amount = Number.parseFloat(formData.get("target_amount") as string) || null
  const image_url = formData.get("image_url") as string

  const updatedSalesRep = await dbUpdateSalesRep(id, name, email, phone, hire_date, target_amount, image_url)

  await logAction(user.id, "UPDATE", "sales_representatives", id, null, updatedSalesRep)

  revalidatePath("/sales-reps")
  revalidatePath(`/sales-reps/${id}`)
}

export async function deleteSalesRep(id: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  await dbDeleteSalesRep(id)

  await logAction(user.id, "DELETE", "sales_representatives", id, null, null)

  revalidatePath("/sales-reps")
  redirect("/sales-reps")
}

// Product Actions
export async function addProduct(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = Number.parseFloat(formData.get("price") as string)
  const image_url = formData.get("image_url") as string

  const product = await dbAddProduct(name, description, price, image_url)

  await logAction(user.id, "CREATE", "products", product.id, null, product)

  revalidatePath("/products")
  redirect("/products")
}

export async function updateProduct(id: number, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = Number.parseFloat(formData.get("price") as string)
  const image_url = formData.get("image_url") as string

  const updatedProduct = await dbUpdateProduct(id, name, description, price, image_url)

  await logAction(user.id, "UPDATE", "products", id, null, updatedProduct)

  revalidatePath("/products")
  revalidatePath(`/products/${id}`)
}

export async function deleteProduct(id: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  await dbDeleteProduct(id)

  await logAction(user.id, "DELETE", "products", id, null, null)

  revalidatePath("/products")
  redirect("/products")
}

// Weekly Sales Report Actions
export async function addWeeklySalesReport(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const sales_rep_id = Number.parseInt(formData.get("sales_rep_id") as string)
  const week_starting = formData.get("week_starting") as string
  const new_clients_targeted = Number.parseInt(formData.get("new_clients_targeted") as string)
  const new_clients_added = Number.parseInt(formData.get("new_clients_added") as string)
  const value_of_new_clients = Number.parseFloat(formData.get("value_of_new_clients") as string)
  const invoices_raised = Number.parseInt(formData.get("invoices_raised") as string)
  const cash_collected = Number.parseFloat(formData.get("cash_collected") as string)
  const key_wins = formData.get("key_wins") as string
  const blockers = formData.get("blockers") as string
  const action_items = formData.get("action_items") as string

  const report = await dbAddWeeklySalesReport(
    sales_rep_id,
    week_starting,
    new_clients_targeted,
    new_clients_added,
    value_of_new_clients,
    invoices_raised,
    cash_collected,
    key_wins,
    blockers,
    action_items,
  )

  await logAction(user.id, "CREATE", "weekly_sales_reports", report.id, null, report)

  revalidatePath("/weekly-reports")
  redirect("/weekly-reports")
}

export async function updateWeeklySalesReport(id: number, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const new_clients_targeted = Number.parseInt(formData.get("new_clients_targeted") as string)
  const new_clients_added = Number.parseInt(formData.get("new_clients_added") as string)
  const value_of_new_clients = Number.parseFloat(formData.get("value_of_new_clients") as string)
  const invoices_raised = Number.parseInt(formData.get("invoices_raised") as string)
  const cash_collected = Number.parseFloat(formData.get("cash_collected") as string)
  const key_wins = formData.get("key_wins") as string
  const blockers = formData.get("blockers") as string
  const action_items = formData.get("action_items") as string

  const updatedReport = await dbUpdateWeeklySalesReport(
    id,
    new_clients_targeted,
    new_clients_added,
    value_of_new_clients,
    invoices_raised,
    cash_collected,
    key_wins,
    blockers,
    action_items,
  )

  await logAction(user.id, "UPDATE", "weekly_sales_reports", id, null, updatedReport)

  revalidatePath("/weekly-reports")
  revalidatePath(`/weekly-reports/${id}`)
}

export async function deleteWeeklySalesReport(id: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  await dbDeleteWeeklySalesReport(id)

  await logAction(user.id, "DELETE", "weekly_sales_reports", id, null, null)

  revalidatePath("/weekly-reports")
  redirect("/weekly-reports")
}

// Client Actions
export async function addClient(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const company = formData.get("company") as string
  const address = formData.get("address") as string
  const sales_rep_id = Number.parseInt(formData.get("sales_rep_id") as string)

  const client = await dbAddClient(name, email, phone, company, address, sales_rep_id)

  await logAction(user.id, "CREATE", "clients", client.id, null, client)

  revalidatePath("/clients")
  redirect("/clients")
}

export async function updateClient(id: number, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const company = formData.get("company") as string
  const address = formData.get("address") as string
  const sales_rep_id = Number.parseInt(formData.get("sales_rep_id") as string)

  const updatedClient = await dbUpdateClient(id, name, email, phone, company, address, sales_rep_id)

  await logAction(user.id, "UPDATE", "clients", id, null, updatedClient)

  revalidatePath("/clients")
  revalidatePath(`/clients/${id}`)
}

export async function deleteClient(id: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  await dbDeleteClient(id)

  await logAction(user.id, "DELETE", "clients", id, null, null)

  revalidatePath("/clients")
  redirect("/clients")
}

// Stakeholder Actions
export async function addStakeholder(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const client_id = Number.parseInt(formData.get("client_id") as string)
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const role = formData.get("role") as string

  const stakeholder = await dbAddStakeholder(client_id, name, email, phone, role)

  await logAction(user.id, "CREATE", "stakeholders", stakeholder.id, null, stakeholder)

  revalidatePath(`/clients/${client_id}`)
}

export async function deleteStakeholder(id: number, client_id: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  await dbDeleteStakeholder(id)

  await logAction(user.id, "DELETE", "stakeholders", id, null, null)

  revalidatePath(`/clients/${client_id}`)
}

// Sales Rep Product Actions
export async function addSalesRepProduct(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const sales_rep_id = Number.parseInt(formData.get("sales_rep_id") as string)
  const product_id = Number.parseInt(formData.get("product_id") as string)

  const salesRepProduct = await dbAddSalesRepProduct(sales_rep_id, product_id)

  await logAction(user.id, "CREATE", "sales_rep_products", salesRepProduct.id, null, salesRepProduct)

  revalidatePath(`/sales-reps/${sales_rep_id}`)
}

// Lead Generation Actions
export async function addLeadGenerationData(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const sales_rep_id = Number.parseInt(formData.get("sales_rep_id") as string)
  const month = formData.get("month") as string
  const leads_generated = Number.parseInt(formData.get("leads_generated") as string)
  const leads_converted = Number.parseInt(formData.get("leads_converted") as string)

  const leadData = await dbAddLeadGenerationData(sales_rep_id, month, leads_generated, leads_converted)

  await logAction(user.id, "CREATE", "lead_generation", leadData.id, null, leadData)

  revalidatePath("/dashboard")
}

export async function updateLeadGenerationData(id: number, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const leads_generated = Number.parseInt(formData.get("leads_generated") as string)
  const leads_converted = Number.parseInt(formData.get("leads_converted") as string)

  const updatedLeadData = await dbUpdateLeadGenerationData(id, leads_generated, leads_converted)

  await logAction(user.id, "UPDATE", "lead_generation", id, null, updatedLeadData)

  revalidatePath("/dashboard")
}

export async function deleteLeadGenerationData(id: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  await dbDeleteLeadGenerationData(id)

  await logAction(user.id, "DELETE", "lead_generation", id, null, null)

  revalidatePath("/dashboard")
}

// File Actions
export async function addFileRecord(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const entity_type = formData.get("entity_type") as string
  const entity_id = Number.parseInt(formData.get("entity_id") as string)
  const file_name = formData.get("file_name") as string
  const file_url = formData.get("file_url") as string
  const file_size = Number.parseInt(formData.get("file_size") as string)

  const fileRecord = await dbAddFileRecord(entity_type, entity_id, file_name, file_url, file_size)

  await logAction(user.id, "CREATE", "files", fileRecord.id, null, fileRecord)

  revalidatePath(`/${entity_type}/${entity_id}`)
}

export async function updateFileRecord(id: number, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const file_name = formData.get("file_name") as string

  const updatedFileRecord = await dbUpdateFileRecord(id, file_name)

  await logAction(user.id, "UPDATE", "files", id, null, updatedFileRecord)

  revalidatePath("/")
}

export async function deleteFileRecord(id: number, entity_type: string, entity_id: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  await dbDeleteFileRecord(id)

  await logAction(user.id, "DELETE", "files", id, null, null)

  revalidatePath(`/${entity_type}/${entity_id}`)
}

// Weekly Report Product Actions
export async function addWeeklyReportProductAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const report_id = Number.parseInt(formData.get("report_id") as string)
  const product_id = Number.parseInt(formData.get("product_id") as string)
  const quantity_sold = Number.parseInt(formData.get("quantity_sold") as string)
  const revenue = Number.parseFloat(formData.get("revenue") as string)

  const reportProduct = await dbAddWeeklyReportProduct(report_id, product_id, quantity_sold, revenue)

  await logAction(user.id, "CREATE", "weekly_report_products", reportProduct.id, null, reportProduct)

  revalidatePath(`/weekly-reports/${report_id}`)
}

export async function updateWeeklyReportProductAction(id: number, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  const quantity_sold = Number.parseInt(formData.get("quantity_sold") as string)
  const revenue = Number.parseFloat(formData.get("revenue") as string)

  const updatedReportProduct = await dbUpdateWeeklyReportProduct(id, quantity_sold, revenue)

  await logAction(user.id, "UPDATE", "weekly_report_products", id, null, updatedReportProduct)

  revalidatePath("/weekly-reports")
}

export async function deleteWeeklyReportProductAction(id: number, report_id: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Authentication required")

  await dbDeleteWeeklyReportProduct(id)

  await logAction(user.id, "DELETE", "weekly_report_products", id, null, null)

  revalidatePath(`/weekly-reports/${report_id}`)
}
