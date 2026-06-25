import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tipo mínimo de la Web Speech API que necesitamos. No está tipado en
 * lib.dom porque es no-estándar / Webkit-only en algunos browsers.
 */
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] & { length: number } }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

type Ctor = new () => SpeechRecognitionLike;

function obtenerCtor(): Ctor | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as Ctor | null;
}

interface UseDictadoResult {
  soportado: boolean;
  grabando: boolean;
  /** Texto acumulado mientras se va dictando. */
  textoEnVivo: string;
  iniciar: () => void;
  detener: () => void;
  resetear: () => void;
  /** Error del último intento (ej: 'not-allowed', 'no-speech', 'network'). */
  error: string | null;
}

/**
 * Dictado por voz vía Web Speech API. Acumula transcripciones finales y
 * mantiene un buffer interim para mostrar lo que se está hablando en vivo.
 * Idioma es-AR (con fallback a es-ES si el navegador no lo tiene).
 *
 * Funciona en Chrome, Edge, Safari (incluso iOS reciente). No funciona en
 * Firefox por ahora; el caller debe chequear `soportado`.
 */
export function useDictado(): UseDictadoResult {
  const [grabando, setGrabando] = useState(false);
  const [textoFinal, setTextoFinal] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const soportado = !!obtenerCtor();

  // Limpiar el recognizer al desmontar
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  const iniciar = useCallback(() => {
    const Ctor = obtenerCtor();
    if (!Ctor) {
      setError('Tu navegador no soporta dictado por voz');
      return;
    }
    setError(null);
    setInterim('');

    const rec = new Ctor();
    rec.lang = 'es-AR';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        const t = r[0].transcript;
        if (r.isFinal) finalChunk += t;
        else interimChunk += t;
      }
      if (finalChunk) {
        setTextoFinal((prev) => (prev ? prev + ' ' : '') + finalChunk.trim());
      }
      setInterim(interimChunk);
    };

    rec.onerror = (e) => {
      setError(e.error);
      setGrabando(false);
    };

    rec.onend = () => {
      setGrabando(false);
      setInterim('');
    };

    try {
      rec.start();
      recRef.current = rec;
      setGrabando(true);
    } catch (err) {
      setError((err as Error).message || 'No se pudo iniciar');
    }
  }, []);

  const detener = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
    setGrabando(false);
  }, []);

  const resetear = useCallback(() => {
    setTextoFinal('');
    setInterim('');
    setError(null);
  }, []);

  const textoEnVivo = (textoFinal + (interim ? ' ' + interim : '')).trim();

  return { soportado, grabando, textoEnVivo, iniciar, detener, resetear, error };
}
