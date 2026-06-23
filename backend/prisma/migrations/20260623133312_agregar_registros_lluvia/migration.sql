-- CreateTable
CREATE TABLE "registros_lluvia" (
    "id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "establecimiento_id" TEXT,
    "fecha" DATE NOT NULL,
    "mm" DECIMAL(8,2) NOT NULL,
    "nota" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_lluvia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registros_lluvia_cuenta_id_fecha_idx" ON "registros_lluvia"("cuenta_id", "fecha");

-- CreateIndex
CREATE INDEX "registros_lluvia_establecimiento_id_idx" ON "registros_lluvia"("establecimiento_id");

-- AddForeignKey
ALTER TABLE "registros_lluvia" ADD CONSTRAINT "registros_lluvia_establecimiento_id_fkey" FOREIGN KEY ("establecimiento_id") REFERENCES "establecimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
