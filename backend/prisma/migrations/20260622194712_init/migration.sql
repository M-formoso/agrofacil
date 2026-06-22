-- CreateEnum
CREATE TYPE "Tenencia" AS ENUM ('propio', 'arrendado', 'mixto');

-- CreateEnum
CREATE TYPE "UnidadArrendamiento" AS ENUM ('qq_ha', 'usd_ha', 'pct_produccion');

-- CreateEnum
CREATE TYPE "TipoCampania" AS ENUM ('fina', 'gruesa');

-- CreateTable
CREATE TABLE "cuentas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email_contacto" TEXT,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "establecimientos" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT,
    "tenencia" "Tenencia" NOT NULL DEFAULT 'propio',
    "superficie_total_ha" DECIMAL(12,4),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "establecimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "establecimiento_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "superficie_ha" DECIMAL(12,4) NOT NULL,
    "tenencia" "Tenencia",
    "arrendamiento_valor" DECIMAL(14,4),
    "arrendamiento_unidad" "UnidadArrendamiento",
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanias" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCampania" NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campanias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cultivos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes_campania" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "lote_id" TEXT NOT NULL,
    "campania_id" TEXT NOT NULL,
    "cultivo_id" TEXT NOT NULL,
    "superficie_sembrada_ha" DECIMAL(12,4) NOT NULL,
    "fecha_siembra" DATE,
    "rinde_estimado_qq_ha" DECIMAL(10,4),
    "rinde_real_qq_ha" DECIMAL(10,4),
    "precio_grano_usd_tn" DECIMAL(14,4),
    "fecha_cosecha" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_campania_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_cuenta_id_idx" ON "usuarios"("cuenta_id");

-- CreateIndex
CREATE INDEX "establecimientos_cuenta_id_idx" ON "establecimientos"("cuenta_id");

-- CreateIndex
CREATE INDEX "lotes_cuenta_id_idx" ON "lotes"("cuenta_id");

-- CreateIndex
CREATE INDEX "lotes_establecimiento_id_idx" ON "lotes"("establecimiento_id");

-- CreateIndex
CREATE INDEX "campanias_cuenta_id_idx" ON "campanias"("cuenta_id");

-- CreateIndex
CREATE UNIQUE INDEX "cultivos_nombre_key" ON "cultivos"("nombre");

-- CreateIndex
CREATE INDEX "lotes_campania_cuenta_id_idx" ON "lotes_campania"("cuenta_id");

-- CreateIndex
CREATE INDEX "lotes_campania_lote_id_idx" ON "lotes_campania"("lote_id");

-- CreateIndex
CREATE INDEX "lotes_campania_campania_id_idx" ON "lotes_campania"("campania_id");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_campania_lote_id_campania_id_key" ON "lotes_campania"("lote_id", "campania_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establecimientos" ADD CONSTRAINT "establecimientos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_establecimiento_id_fkey" FOREIGN KEY ("establecimiento_id") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanias" ADD CONSTRAINT "campanias_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_campania" ADD CONSTRAINT "lotes_campania_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_campania" ADD CONSTRAINT "lotes_campania_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campanias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_campania" ADD CONSTRAINT "lotes_campania_cultivo_id_fkey" FOREIGN KEY ("cultivo_id") REFERENCES "cultivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
