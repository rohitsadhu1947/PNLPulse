-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(100) NOT NULL,
    "table_name" VARCHAR(100),
    "record_id" INTEGER,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "client_type" VARCHAR(50),
    "industry" VARCHAR(100),
    "website" VARCHAR(255),
    "company_size" VARCHAR(50),
    "hq_location" VARCHAR(255),
    "pan_gst_number" VARCHAR(50),
    "lead_source" VARCHAR(50),
    "account_owner_id" INTEGER,
    "sales_stage" VARCHAR(50),
    "deal_value" DECIMAL(15,2),
    "target_close_date" DATE,
    "probability_to_close" INTEGER,
    "notes" TEXT,
    "products_interested" INTEGER[],
    "pricing_model" VARCHAR(50),
    "custom_requirements" TEXT,
    "tc_compliance_status" VARCHAR(50),
    "onboarding_status" VARCHAR(50),
    "csm_assigned" VARCHAR(100),
    "support_channels" TEXT[],
    "renewal_date" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "annual_sales_target" DECIMAL DEFAULT 0,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "permissions" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_lead_generation" (
    "id" SERIAL NOT NULL,
    "weekly_report_id" INTEGER,
    "generator_id" INTEGER,
    "recipient_id" INTEGER,
    "leads_generated" INTEGER NOT NULL DEFAULT 0,
    "leads_converted" INTEGER NOT NULL DEFAULT 0,
    "value_of_converted_leads" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "commission_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "commission_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_lead_generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_rep_products" (
    "id" SERIAL NOT NULL,
    "sales_rep_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "units_sold" INTEGER NOT NULL DEFAULT 0,
    "revenue_generated" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sale_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "client_id" INTEGER NOT NULL,
    "invoices_raised" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cash_collected" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "invoice_date" DATE,
    "cash_collection_date" DATE,

    CONSTRAINT "sales_rep_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_representatives" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "hire_date" DATE NOT NULL,
    "target_amount" DECIMAL(15,2),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_representatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stakeholders" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "designation" VARCHAR(100),
    "decision_role" VARCHAR(50),
    "relationship_status" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stakeholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "role_id" INTEGER,
    "assigned_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" INTEGER,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "last_login" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_sales_reports" (
    "id" SERIAL NOT NULL,
    "sales_rep_id" INTEGER,
    "week_starting" DATE NOT NULL,
    "new_clients_targeted" INTEGER NOT NULL DEFAULT 0,
    "new_clients_added" INTEGER NOT NULL DEFAULT 0,
    "value_of_new_clients" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "invoices_raised" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cash_collected" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "key_wins" TEXT,
    "blockers" TEXT,
    "action_items" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_sales_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_rep_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "phone" VARCHAR(50),
    "hire_date" DATE NOT NULL,
    "target_amount" DECIMAL(15,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_rep_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_table_name" ON "audit_logs"("table_name");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_clients_account_owner" ON "clients"("account_owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "idx_sales_lead_generation_generator_id" ON "sales_lead_generation"("generator_id");

-- CreateIndex
CREATE INDEX "idx_sales_lead_generation_recipient_id" ON "sales_lead_generation"("recipient_id");

-- CreateIndex
CREATE INDEX "idx_sales_lead_generation_weekly_report_id" ON "sales_lead_generation"("weekly_report_id");

-- CreateIndex
CREATE INDEX "idx_sales_rep_products_product_id" ON "sales_rep_products"("product_id");

-- CreateIndex
CREATE INDEX "idx_sales_rep_products_sales_rep_id" ON "sales_rep_products"("sales_rep_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_rep_products_sales_rep_id_product_id_sale_date_key" ON "sales_rep_products"("sales_rep_id", "product_id", "sale_date");

-- CreateIndex
CREATE UNIQUE INDEX "sales_representatives_email_key" ON "sales_representatives"("email");

-- CreateIndex
CREATE INDEX "idx_stakeholders_client_id" ON "stakeholders"("client_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_role_id" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_user_id" ON "user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_is_active" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "idx_weekly_sales_reports_sales_rep_id" ON "weekly_sales_reports"("sales_rep_id");

-- CreateIndex
CREATE INDEX "idx_weekly_sales_reports_week_starting" ON "weekly_sales_reports"("week_starting");

-- CreateIndex
CREATE UNIQUE INDEX "sales_rep_profiles_user_id_key" ON "sales_rep_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_account_owner_id_fkey" FOREIGN KEY ("account_owner_id") REFERENCES "sales_representatives"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_lead_generation" ADD CONSTRAINT "sales_lead_generation_generator_id_fkey" FOREIGN KEY ("generator_id") REFERENCES "sales_representatives"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_lead_generation" ADD CONSTRAINT "sales_lead_generation_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "sales_representatives"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_lead_generation" ADD CONSTRAINT "sales_lead_generation_weekly_report_id_fkey" FOREIGN KEY ("weekly_report_id") REFERENCES "weekly_sales_reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_rep_products" ADD CONSTRAINT "sales_rep_products_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_rep_products" ADD CONSTRAINT "sales_rep_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_rep_products" ADD CONSTRAINT "sales_rep_products_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "sales_representatives"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "weekly_sales_reports" ADD CONSTRAINT "weekly_sales_reports_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "sales_representatives"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_rep_profiles" ADD CONSTRAINT "sales_rep_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
