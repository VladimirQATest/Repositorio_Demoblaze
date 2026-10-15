#!/usr/bin/env node
/**
 * Runner de ejecución individual de pruebas — DemoBlaze (Playwright).
 *
 * Ejecuta un archivo o un caso concreto, con navegador visible (headed)
 * o sin él (headless), y con opciones útiles para depurar.
 *
 * Uso:
 *   node scripts/run.mjs                                      # todas (headless)
 *   node scripts/run.mjs tests/auth.spec.ts                   # un archivo
 *   node scripts/run.mjs --test "login with valid credentials"  # un caso
 *   node scripts/run.mjs tests/auth.spec.ts --test "login with valid" --headed
 *   node scripts/run.mjs --list                               # listar casos
 *   node scripts/run.mjs --ui                                 # modo UI
 *
 * Opciones:
 *   --test "<título>"      Filtrar por título del caso (acepta regexp)
 *   --describe "<título>"  Filtrar por bloque describe
 *   --headed               Abrir el navegador visible
 *   --headless             Sin ventana de navegador (por defecto)
 *   --browser <nombre>     chromium (por defecto) | firefox | webkit
 *   --workers <n>          Paralelismo (por defecto: 1 cuando es headed)
 *   --slow-mo <ms>         Pausa entre acciones, ideal para demos
 *   --repeat <n>           Repetir cada caso n veces
 *   --grep "<regexp>"      Filtro crudo de Playwright sobre el título completo
 *   --ui                   Modo UI interactivo (anula --headed)
 *   --debug                Depurador paso a paso
 *   --list                 Solo listar los casos, sin ejecutar
 *   --help                 Mostrar esta ayuda
 *
 * Atajos (package.json):
 *   npm run t            -- <args>    # igual que node scripts/run.mjs <args>
 *   npm run t:headed     -- <args>    # lo mismo, forzando --headed
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const BROWSERS = ['chromium', 'firefox', 'webkit', 'mobile'];

const flags = {
  file: null,
  test: null,
  describe: null,
  headed: false,
  headless: false,
  browser: 'chromium',
  workers: null,
  slowMo: null,
  repeat: null,
  grep: null,
  ui: false,
  debug: false,
  list: false,
  help: false,
};

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  console.error('Ejecuta con --help para ver las opciones disponibles.');
  process.exit(1);
}

// --- Parseo de argumentos ---
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  switch (arg) {
    case '--test':
    case '--describe':
    case '--browser':
    case '--workers':
    case '--slow-mo':
    case '--repeat':
    case '--grep': {
      const value = argv[++i];
      if (!value) fail(`La opción ${arg} necesita un valor.`);
      flags[arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      break;
    }
    case '--headed':
      flags.headed = true;
      break;
    case '--headless':
      flags.headless = true;
      break;
    case '--ui':
      flags.ui = true;
      break;
    case '--debug':
      flags.debug = true;
      break;
    case '--list':
      flags.list = true;
      break;
    case '--help':
    case '-h':
      flags.help = true;
      break;
    default:
      if (arg.startsWith('-')) fail(`Opción desconocida: ${arg}`);
      if (flags.file) fail('Solo se puede indicar un archivo de pruebas.');
      flags.file = arg;
  }
}

if (flags.help) {
  console.log(`
Runner de pruebas individuales — DemoBlaze (Playwright)

Uso: node scripts/run.mjs [archivo.spec.ts] [opciones]

Opciones:
  --test "<título>"      Filtrar por título del caso (acepta regexp)
  --describe "<título>"  Filtrar por bloque describe
  --headed               Abrir el navegador visible
  --headless             Sin ventana de navegador (por defecto)
  --browser <nombre>     chromium (por defecto) | firefox | webkit
  --workers <n>          Paralelismo (por defecto: 1 cuando es headed)
  --slow-mo <ms>         Pausa entre acciones, ideal para demos
  --repeat <n>           Repetir cada caso n veces
  --grep "<regexp>"      Filtro crudo de Playwright sobre el título completo
  --ui                   Modo UI interactivo (anula --headed)
  --debug                Depurador paso a paso
  --list                 Solo listar los casos, sin ejecutar
  --help                 Mostrar esta ayuda

Ejemplos:
  node scripts/run.mjs tests/auth.spec.ts
  node scripts/run.mjs --test "login with valid credentials" --headed
  node scripts/run.mjs --describe "Cart and checkout" --browser firefox
  node scripts/run.mjs tests/catalog.spec.ts --slow-mo 300 --headed
  node scripts/run.mjs --list
`);
  process.exit(0);
}

if (flags.headed && flags.headless) fail('No se puede usar --headed y --headless a la vez.');
if (flags.ui && (flags.headed || flags.headless)) fail('--ui gestiona su propio navegador; no la combines con --headed/--headless.');
if (flags.debug && flags.ui) fail('--ui y --debug son modos interactivos excluyentes.');
if (!BROWSERS.includes(flags.browser)) {
  fail(`Navegador no soportado: "${flags.browser}". Opciones: ${BROWSERS.join(', ')}.`);
}

// --- Resolución del CLI de Playwright (sin depender de npx) ---
let cliPath;
try {
  cliPath = require.resolve('@playwright/test/cli');
} catch {
  fail('No se encontró @playwright/test. Ejecuta `npm install` primero.');
}

// --- Construcción de la línea de comandos ---
const pwArgs = ['test'];

if (flags.list) pwArgs.push('--list');
if (flags.ui) pwArgs.push('--ui');
if (flags.debug) pwArgs.push('--debug');

if (flags.file) pwArgs.push(flags.file);

// El --grep de Playwright coincide contra el título completo
// (describe + test separados por espacio).
const pattern = [flags.describe, flags.test].filter(Boolean).join(' ');
const grep = flags.grep || (pattern || null);
if (grep) pwArgs.push(`--grep=${grep}`);

pwArgs.push(`--project=${flags.browser}`);

if (flags.headed) pwArgs.push('--headed');

// En headed conviene 1 worker: el sitio demo tiene estado global compartido.
const workers = flags.workers ?? (flags.headed ? '1' : undefined);
if (workers) pwArgs.push(`--workers=${workers}`);

if (flags.repeat) pwArgs.push(`--repeat-each=${flags.repeat}`);

// slowMo no tiene bandera CLI; se inyecta vía variable de entorno
// que playwright.config.ts lee (PW_SLOW_MO).
const env = { ...process.env };
if (flags.slowMo) {
  if (!/^\d+$/.test(flags.slowMo)) fail('--slow-mo debe ser un número entero (milisegundos).');
  env.PW_SLOW_MO = flags.slowMo;
}

// --- Banner ---
const mode = flags.list ? 'listar' : flags.ui ? 'modo UI' : flags.debug ? 'debug' : 'ejecutar';
const scope = flags.file
  ? flags.file
  : grep
    ? `casos que coincidan con "${grep}"`
    : 'todas las pruebas';
console.log(`\n▶ ${mode.toUpperCase()}: ${scope}`);
console.log(`  navegador: ${flags.browser}${flags.headed ? ' (headed)' : ''}${flags.ui ? ' (UI)' : ''}`);
if (workers) console.log(`  workers: ${workers}`);
if (env.PW_SLOW_MO) console.log(`  slow-mo: ${env.PW_SLOW_MO} ms`);
console.log('');

// --- Ejecución ---
const child = spawn(process.execPath, [cliPath, ...pwArgs], {
  stdio: 'inherit',
  env,
});

child.on('close', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error(`\n❌ No se pudo lanzar Playwright: ${err.message}`);
  process.exit(1);
});
