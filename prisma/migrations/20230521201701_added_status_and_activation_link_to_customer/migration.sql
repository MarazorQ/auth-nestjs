-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INVITED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "activationCode" VARCHAR(36) NOT NULL DEFAULT '',
ADD COLUMN     "status" "CustomerStatus" NOT NULL DEFAULT 'INVITED';
