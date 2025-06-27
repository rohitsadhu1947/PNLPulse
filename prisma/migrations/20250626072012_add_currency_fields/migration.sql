-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "deal_currency" VARCHAR(3) DEFAULT 'INR';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "currency" VARCHAR(3) DEFAULT 'INR';

-- AlterTable
ALTER TABLE "sales_lead_generation" ADD COLUMN     "commission_currency" VARCHAR(3) DEFAULT 'INR',
ADD COLUMN     "value_currency" VARCHAR(3) DEFAULT 'INR';

-- AlterTable
ALTER TABLE "sales_rep_products" ADD COLUMN     "cash_currency" VARCHAR(3) DEFAULT 'INR',
ADD COLUMN     "invoice_currency" VARCHAR(3) DEFAULT 'INR',
ADD COLUMN     "revenue_currency" VARCHAR(3) DEFAULT 'INR';

-- AlterTable
ALTER TABLE "sales_representatives" ADD COLUMN     "target_currency" VARCHAR(3) DEFAULT 'INR';

-- AlterTable
ALTER TABLE "weekly_sales_reports" ADD COLUMN     "cash_currency" VARCHAR(3) DEFAULT 'INR',
ADD COLUMN     "invoice_currency" VARCHAR(3) DEFAULT 'INR',
ADD COLUMN     "value_currency" VARCHAR(3) DEFAULT 'INR';
