/**
 * Modo demo: la aplicación completa bajo /demo con datos ficticios en memoria.
 * No llama al servidor ni toca la sesión o los datos reales guardados en el navegador.
 */
export const DEMO = /^\/demo(\/|$)/.test(window.location.pathname);

/** /demo enseña la zona de atleta; /demo/entrenador, el panel de entrenador (solo lectura). */
export const DEMO_COACH = /^\/demo\/entrenador(\/|$)/.test(window.location.pathname);

/**
 * La demo dentro del visor móvil de la landing (mismo origen, en un iframe). Sin aviso de demo ni service worker:
 * la landing ya explica qué es y el iframe no debe instalar nada.
 */
export const EMBED = DEMO && window.parent !== window;
if (EMBED) document.documentElement.classList.add('is-embed');

const DEMO_EMAIL = 'demo@ascension.example';

/** Almacén en memoria con la misma interfaz que localStorage. */
class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  clear() {
    this.items.clear();
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
}

if (DEMO) {
  // La demo comparte origen con la app real: aislar el almacenamiento evita pisar borradores,
  // preferencias o la cuenta recordada de quien ya usa Ascension en este navegador.
  for (const kind of ['localStorage', 'sessionStorage'] as const) {
    const storage = new MemoryStorage();
    if (kind === 'localStorage') {
      storage.setItem(
        `ascension:coach-tour:v2:${encodeURIComponent(DEMO_EMAIL)}`,
        JSON.stringify({ status: 'dismissed', step: 0 }),
      );
      storage.setItem(`ascension_passkey_prompt:${DEMO_EMAIL}`, '1');
    }
    Object.defineProperty(window, kind, { value: storage, configurable: true });
  }
}

const encode = (value: object) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** JWT sin firma, solo para que la interfaz tenga un usuario que mostrar. */
export const DEMO_TOKEN = [
  encode({ alg: 'none', typ: 'JWT' }),
  encode({
    sub: 'demo',
    email: DEMO_EMAIL,
    name: DEMO_COACH ? 'Entrenador demo' : 'Atleta demo',
    // Retratos libres de randomuser.me para que la cabecera se vea como con una cuenta real.
    picture: `https://randomuser.me/api/portraits/${DEMO_COACH ? 'men/32' : 'women/68'}.jpg`,
    exp: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 3600,
  }),
  'demo',
].join('.');
