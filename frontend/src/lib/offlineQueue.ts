/**
 * Cola de operaciones offline.
 *
 * Cuando el productor está en el campo sin señal y registra una lluvia,
 * labor o insumo, la mutation se intercepta en apiClient y se guarda acá.
 * Sobrevive a cierres del browser (localStorage).
 *
 * Cuando vuelve la conexión (evento 'online' o al abrir la app), el hook
 * useOfflineSync lee la cola y reintenta cada operación en orden.
 *
 * Reglas:
 *  - Solo se encolan POST/PATCH/DELETE (mutaciones).
 *  - Los GET no se encolan: si no hay red, fallan o se sirven del cache PWA.
 *  - Orden FIFO: las primeras en encolarse son las primeras en enviarse.
 *  - Si un op falla con 4xx (validación), se descarta (datos inválidos
 *    que nunca van a entrar). Si falla con 5xx o network, se mantiene.
 */

const STORAGE_KEY = 'agrofacil:offline-queue:v1';

export interface QueuedOperation {
  /** ID único para identificar este op */
  id: string;
  /** Path relativo (ej. '/lluvias') */
  url: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Etiqueta humana para mostrar en UI: "Lluvia 12mm — Lote 4" */
  label: string;
  /** Cuándo se encoló (ms epoch) */
  createdAt: number;
  /** Cuántas veces ya intentamos enviarla */
  intentos: number;
}

function leerRaw(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedOperation[]) : [];
  } catch {
    return [];
  }
}

function escribir(ops: QueuedOperation[]): void {
  try {
    if (ops.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    // Notificar a los listeners (útil cuando la app abre nuevas pestañas)
    window.dispatchEvent(new CustomEvent('agrofacil:queue-changed', { detail: ops }));
  } catch (err) {
    // localStorage puede estar lleno o bloqueado (incognito en algunos casos)
    console.error('No se pudo escribir la cola offline', err);
  }
}

export const offlineQueue = {
  /** Lee la cola entera (FIFO). */
  list(): QueuedOperation[] {
    return leerRaw();
  },

  /** Cantidad de pendientes. */
  size(): number {
    return leerRaw().length;
  },

  /** Agrega un op al final. Devuelve el op con id generado. */
  enqueue(op: Omit<QueuedOperation, 'id' | 'createdAt' | 'intentos'>): QueuedOperation {
    const queue = leerRaw();
    const id = `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullOp: QueuedOperation = { ...op, id, createdAt: Date.now(), intentos: 0 };
    queue.push(fullOp);
    escribir(queue);
    return fullOp;
  },

  /** Quita un op por id. */
  remove(id: string): void {
    const queue = leerRaw().filter((op) => op.id !== id);
    escribir(queue);
  },

  /** Marca un intento fallido en un op (para reintento exponencial futuro). */
  marcarIntento(id: string): void {
    const queue = leerRaw().map((op) =>
      op.id === id ? { ...op, intentos: op.intentos + 1 } : op,
    );
    escribir(queue);
  },

  /** Vacía la cola entera (acción de admin / debugging). */
  clear(): void {
    escribir([]);
  },
};

/** Helper para escuchar cambios en la cola desde React. */
export function suscribirseAColaOffline(callback: (queue: QueuedOperation[]) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<QueuedOperation[]>).detail);
  window.addEventListener('agrofacil:queue-changed', handler);
  return () => window.removeEventListener('agrofacil:queue-changed', handler);
}

/** Construye una etiqueta humana a partir de una request encolada. Pensada
 *  para que el productor vea "Lluvia 12mm" en lugar de "POST /lluvias". */
export function derivarEtiqueta(url: string, method: string, body: unknown): string {
  const b = (body as Record<string, unknown>) ?? {};

  if (url.startsWith('/lluvias') && method === 'POST') {
    const mm = b.mm as number | undefined;
    return mm !== undefined ? `Lluvia ${mm} mm` : 'Lluvia';
  }
  if (url.startsWith('/labores')) {
    const tipo = b.tipo as string | undefined;
    return tipo ? `Labor: ${tipo}` : 'Labor';
  }
  if (url.startsWith('/insumos-aplicados')) {
    const producto = b.producto as string | undefined;
    return producto ? `Insumo: ${producto}` : 'Insumo';
  }
  if (url.startsWith('/establecimientos')) return method === 'POST' ? 'Nuevo establecimiento' : 'Editar establecimiento';
  if (url.startsWith('/lotes-campania')) return method === 'POST' ? 'Asignar lote a campaña' : 'Editar lote-campaña';
  if (url.startsWith('/lotes')) return method === 'POST' ? 'Nuevo lote' : 'Editar lote';
  if (url.startsWith('/campanias')) return method === 'POST' ? 'Nueva campaña' : 'Editar campaña';
  if (url.startsWith('/cultivos')) return method === 'POST' ? 'Nuevo cultivo' : 'Editar cultivo';

  return `${method} ${url}`;
}
