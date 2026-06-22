-- CreateEnum
CREATE TYPE "TipoLabor" AS ENUM ('siembra', 'pulverizacion', 'fertilizacion', 'cosecha', 'otra');

-- CreateEnum
CREATE TYPE "Ejecutor" AS ENUM ('propio', 'contratista');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('contado', 'canje', 'financiado');

-- CreateEnum
CREATE TYPE "TipoInsumo" AS ENUM ('semilla', 'fertilizante', 'herbicida', 'insecticida', 'fungicida', 'otro');

-- CreateTable
CREATE TABLE "labores" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "lote_campania_id" TEXT NOT NULL,
    "tipo" "TipoLabor" NOT NULL,
    "fecha" DATE NOT NULL,
    "ejecutor" "Ejecutor" NOT NULL DEFAULT 'contratista',
    "costo_total_usd" DECIMAL(14,4),
    "forma_pago" "FormaPago",
    "nota" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insumos_aplicados" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "lote_campania_id" TEXT NOT NULL,
    "tipo" "TipoInsumo" NOT NULL,
    "producto" TEXT NOT NULL,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "unidad" TEXT NOT NULL,
    "costo_total_usd" DECIMAL(14,4) NOT NULL,
    "forma_pago" "FormaPago",
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insumos_aplicados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "labores_cuenta_id_idx" ON "labores"("cuenta_id");

-- CreateIndex
CREATE INDEX "labores_lote_campania_id_idx" ON "labores"("lote_campania_id");

-- CreateIndex
CREATE INDEX "insumos_aplicados_cuenta_id_idx" ON "insumos_aplicados"("cuenta_id");

-- CreateIndex
CREATE INDEX "insumos_aplicados_lote_campania_id_idx" ON "insumos_aplicados"("lote_campania_id");

-- AddForeignKey
ALTER TABLE "labores" ADD CONSTRAINT "labores_lote_campania_id_fkey" FOREIGN KEY ("lote_campania_id") REFERENCES "lotes_campania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_aplicados" ADD CONSTRAINT "insumos_aplicados_lote_campania_id_fkey" FOREIGN KEY ("lote_campania_id") REFERENCES "lotes_campania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
