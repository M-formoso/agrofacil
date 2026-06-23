-- CreateEnum
CREATE TYPE "OrigenLluvia" AS ENUM ('manual', 'open_meteo');

-- AlterTable
ALTER TABLE "registros_lluvia" ADD COLUMN     "origen" "OrigenLluvia" NOT NULL DEFAULT 'manual';
