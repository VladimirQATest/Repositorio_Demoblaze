# DemoBlaze Automation — Playwright

Automomatización E2E para **https://demoblaze.com/** (PRODUCT STORE, demo de BlazeMeter).
Toda la referencia de selectores, flujos, API y reglas de negocio está en
[`../demoblaze-knowledge-base.md`](../demoblaze-knowledge-base.md).
Los comandos de ejecución individual (headed / headless), depuración y buenas prácticas de QA
están en [`GUIA-EJECUCION-PRUEBAS.md`](GUIA-EJECUCION-PRUEBAS.md).

## Requisitos

- Node.js 18+
- Playwright (se instala con el proyecto)

## Instalación

```bash
npm install
npx playwright install chromium
```

## Ejecución

```bash
npm test                  # todas las pruebas (headless, Chromium)
npm run test:ui           # modo UI interactivo
npm run test:headed       # con navegador visible
npm run test:api          # solo la suite de API
npm run test:firefox      # suite completa en Firefox (ver nota abajo)
npm run test:mobile       # suite completa en vista móvil (Pixel 7, 412x915)
npm run report            # ver reporte HTML
```

> **Navegadores**: `playwright.config.ts` declara los proyectos `chromium` (por defecto) y
> `firefox`. El runner ya pasa siempre `--project=chromium` salvo que uses `--browser <nombre>`.
> **Ojo**: el binario de Firefox crashea en este equipo (`0xC0000409` en `ucrtbase.dll`) incluso
> fuera de Playwright — es un problema del entorno, no de la suite. Detalle y soluciones en
> [`GUIA-EJECUCION-PRUEBAS.md`](GUIA-EJECUCION-PRUEBAS.md) §13.

## Ejecución individual (runner `scripts/run.mjs`)

```bash
npm run t -- --list                                   # listar todos los casos
npm run t -- tests/auth.spec.ts                       # un archivo completo
npm run t -- --test "login with valid credentials"    # un caso concreto
npm run t -- --test "login with valid" --headed       # ese caso, con navegador visible
npm run t -- --describe "Cart and checkout"           # todos los casos de un describe
npm run t -- tests/catalog.spec.ts --headed --slow-mo 300   # demo con pausa entre acciones
npm run t -- --test "checkout" --repeat 3             # repetir un caso 3 veces
npm run t -- --browser firefox                        # cambiar de navegador
npm run t -- --ui                                     # modo UI (depurar interactivamente)
npm run t -- --debug                                  # depurador paso a paso
```

Notas del runner:

- Sin flags extra ejecuta **headless**; `--headed` abre la ventana del navegador
  y baja a **1 worker** (el sitio demo tiene estado global compartido).
- `--test` y `--describe` se combinan contra el título completo
  (`describe + test`); ambos aceptan expresiones regulares.
- `--slow-mo` inyecta `PW_SLOW_MO` al config (`playwright.config.ts`).
- La forma nativa equivalente es `npx playwright test <archivo> --grep="<título>" --headed`.

## Estructura

```
demoblaze-automation/
├── playwright.config.ts      # baseURL, viewport 1280x720, Chromium
├── pages/
│   ├── HomePage.ts           # catálogo, categorías, paginación
│   ├── ProductPage.ts        # detalle + Add to cart
│   └── CartPage.ts           # tabla, total, Place Order
├── pages/components/
│   ├── NavBar.ts             # navegación, estado login/logout
│   ├── LoginModal.ts
│   ├── SignUpModal.ts
│   ├── ContactModal.ts
│   ├── AboutModal.ts
│   └── OrderModal.ts
├── fixtures/
│   └── testFixtures.ts       # api, uniqueUsername, authenticatedPage
├── test-data/
│   └── users.ts              # datos de prueba compartidos
├── utils/
│   ├── api.ts                # cliente API (10 endpoints)
│   ├── password.ts           # b64EncodeUnicode (la app codifica contraseñas en base64)
│   ├── dialogs.ts            # manejador global de alert()
│   └── sweetalert.ts         # helper del popup de compra
└── tests/
    ├── api.spec.ts
    ├── auth.spec.ts
    ├── catalog.spec.ts
    ├── product.spec.ts
    ├── cart-checkout.spec.ts
    └── contact-about.spec.ts
```

## Notas clave

- **Casi toda acción dispara un `alert()`** — el manejador global de diálogos (`utils/dialogs.ts`)
  debe estar instalado en cada prueba que espera una alerta; de lo contrario la prueba se bloquea.
- La compra exitosa usa **SweetAlert** (no un diálogo nativo) — ver `utils/sweetalert.ts`.
- Login/registro exitosos recargan la página; los fixtures usan cookies (`tokenp_`) y assertions
  auto-reintentiadas para absorber la recarga.
- El sitio es un demo público con estado global compartido: se generan usuarios únicos por ejecución.
