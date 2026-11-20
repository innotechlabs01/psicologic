import { db as client } from '../client';

export interface SubMenuItem {
  id: number | string;
  name: string;
  slug?: string;
  nametext?: string;
  status: boolean;
}

export interface MenuItem {
  id: number | string;
  name: string;
  slug?: string;
  nametext?: string;
  status: boolean;
  subItem?: SubMenuItem[];
}

export const DEFAULT_PSYCHOLOGIST_MENU: MenuItem[] = [
  { id: 1, name: 'users', slug: 'users', nametext: 'Pacientes', status: true },
  { id: 2, name: 'agenda', slug: 'agenda', nametext: 'Agenda', status: true },
  { id: 3, name: 'Historia Clinica', slug: 'history', nametext: 'Historia Clínica', status: true },
  {
    id: 4,
    name: 'Juego',
    slug: 'juego',
    nametext: 'Juegos',
    status: true,
    subItem: [
      { id: 1, name: 'cartas', slug: 'cartas', nametext: 'Cartas', status: true },
      { id: 2, name: 'miedo', slug: 'miedo', nametext: 'Superar Miedos', status: true },
      { id: 3, name: 'emociones', slug: 'emociones', nametext: 'Emociones', status: true },
    ],
  },
  { id: 5, name: 'payment', slug: 'payment', nametext: 'Pagos', status: true },
  { id: 6, name: 'message', slug: 'message', nametext: 'Mensajes', status: true },
  { id: 7, name: 'feedback', slug: 'feedback', nametext: 'Feedback', status: true },
  {
    id: 8,
    name: 'Configuraciones',
    slug: 'settings',
    nametext: 'Configuraciones',
    status: true,
    subItem: [
      { id: 1, name: 'template', slug: 'template', nametext: 'Plantillas', status: true },
      { id: 2, name: 'config_agend', slug: 'config_agend', nametext: 'Config. Horario', status: false },
    ],
  },
];

export const DEFAULT_GAME_ONLY_MENU: MenuItem[] = [
  DEFAULT_PSYCHOLOGIST_MENU[3],
  DEFAULT_PSYCHOLOGIST_MENU[4],
];

const CONFIG_KEY = 'default_psychologist_menu';

async function ensureConfigTable(): Promise<void> {
  await client.execute(
    `CREATE TABLE IF NOT EXISTS platform_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT
    )`
  );
}

export async function getGlobalDefaultMenu(): Promise<MenuItem[]> {
  try {
    await ensureConfigTable();
    const res = await client.execute({
      sql: `SELECT value FROM platform_config WHERE key = ? LIMIT 1`,
      args: [CONFIG_KEY],
    });
    const raw = res.rows?.[0]?.value;
    if (raw) {
      const parsed = JSON.parse(String(raw));
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.menu)) return parsed.menu;
    }
  } catch (err) {
    console.warn('getGlobalDefaultMenu fallback:', err);
  }
  return DEFAULT_PSYCHOLOGIST_MENU;
}

export async function saveGlobalDefaultMenu(menu: MenuItem[]): Promise<void> {
  await ensureConfigTable();
  const payload = JSON.stringify({ menu });
  const now = new Date().toISOString();
  await client.execute({
    sql: `INSERT INTO platform_config (key, value, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [CONFIG_KEY, payload, now],
  });
}
