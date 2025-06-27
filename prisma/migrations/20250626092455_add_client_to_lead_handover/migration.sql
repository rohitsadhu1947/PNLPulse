/*
  Warnings:

  - You are about to drop the `sales_rep_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sales_rep_profiles" DROP CONSTRAINT "sales_rep_profiles_user_id_fkey";

-- AlterTable
ALTER TABLE "sales_lead_generation" ADD COLUMN     "client_id" INTEGER;

-- DropTable
DROP TABLE "sales_rep_profiles";

-- CreateIndex
CREATE INDEX "idx_sales_lead_generation_client_id" ON "sales_lead_generation"("client_id");

-- AddForeignKey
ALTER TABLE "sales_lead_generation" ADD CONSTRAINT "sales_lead_generation_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
