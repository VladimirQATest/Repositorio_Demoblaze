# Guía de ejecución de pruebas — DemoBlaze (Playwright)

> **Documento de referencia QA.** Comandos para ejecutar los casos de prueba de forma
> individual, **headed** (navegador visible) y **no headed / headless** (sin ventana),
> más las recomendaciones de trabajo para quien tome el proyecto en el futuro.
>
> - Suite: `demoblaze-automation/` (Playwright **1.64.0** instalado / `^1.49.0` en `package.json`)
> - Objetivo: `tests/` — **31 casos en 6 archivos**
> - Base funcional (selectores, flujos, API, reglas de negocio): [`../demoblaze-knowledge-base.md`](../demoblaze-knowledge-base.md)
> - Configuración: [`playwright.config.ts`](playwright.config.ts) · Runner: [`scripts/run.mjs`](scripts/run.mjs)

---

## 1. Requisitos y preparación (una sola vez)

```bash
cd D:\Curso_IA_QA\demoblaze-automation
npm install                 # dependencias del proyecto
npx playwright install      # navegadores (Chromium por defecto)
npx playwright install chromium firefox webkit   # solo si vas a cross-browser
node -v                     # requiere Node.js 18+
```

Verificación rápida de que todo está bien:

```bash
node scripts/run.mjs --list        # debe listar 31 casos sin abrir navegador
```

> Todas las pruebas atacan **https://demoblaze.com** en vivo: necesitas **conexión a internet**
> y el sitio no debe estar caído. No hay mocks ni entorno de pruebas local.

---

## 2. Las dos formas de ejecutar

| Vía | Cuándo usarla | Ejemplo |
|---|---|---|
| **Runner `npm run t`** (envuelve `scripts/run.mjs`) | Uso diario: valida los flags, muestra un banner con el modo y fuerza 1 worker en headed | `npm run t -- tests/auth.spec.ts --test "login with valid"` |
| **CLI nativa de Playwright** (`npx playwright test`) | Para todo lo que el runner no expone (`--last-failed`, `--trace`, `--shard`, `--only-changed`, `--retries`, etc.) | `npx playwright test tests/auth.spec.ts -g "login with valid"` |

Ambas ejecutan **exactamente la misma suite**; el runner solo construye la línea de comando.

### Scripts npm disponibles

| Script | Comando | Qué hace |
|---|---|---|
| `npm test` | `playwright test` | Suite completa, **headless** |
| `npm run test:ui` | `playwright test --ui` | Modo UI interactivo (Time Machine) |
| `npm run test:headed` | `playwright test --headed` | Suite completa **headed** |
| `npm run test:api` | `playwright test tests/api.spec.ts` | Solo API |
| `npm run report` | `playwright show-report` | Abre el reporte HTML de la última ejecución |
| `npm run t` | `node scripts/run.mjs` | Runner: ejecución individual (headless) |
| `npm run t:headed` | `node scripts/run.mjs --headed` | Runner forzando **headed** |
| `npm run t:list` | `node scripts/run.mjs --list` | Lista todos los casos sin ejecutar |
| `npm run dashboard` | `start dashboard.html` | Dashboard HTML local (Windows) |

> ⚠️ **Regla de npm:** todo argumento que empiece por `--` debe ir **después** de un `--`:
> `npm run t -- --headed`. Si lo olvidas, npm lo interpreta y falla.

---

## 3. Las 4 dimensiones de una ejecución individual

Para llegar a un caso concreto se combinan siempre estos filtros:

| # | Filtro | Runner | Nativo |
|---|---|---|---|
| 1 | **Archivo** `.spec.ts` | `tests/auth.spec.ts` | `tests/auth.spec.ts` |
| 2 | **Bloque `describe`** | `--describe "Cart and checkout"` | `-g "Cart and checkout"` / `--grep=` |
| 3 | **Título del caso** | `--test "login with valid"` | `-g "login with valid"` |
| 4 | **Línea exacta** | `tests/auth.spec.ts:55` | `tests/auth.spec.ts:55` |

Notas importantes:

- `--describe` y `--test` **se combinan** en un único patrón contra el título completo
  (`"Cart and checkout deleting an item recalculates the cart total"`).
- Ambas opciones aceptan **expresiones regulares** y son **sensibles a mayúsculas/minúsculas**.
  Ej.: `--test "^login"` ejecuta todos los casos que empiezan por `login`.
- Los títulos con caracteres especiales (`"`, `(`, `)`, `/`) se rompen como regex:
  usa un fragmento simple (`--test "already exist"` en vez de `--test "This user already exist."`).
- La forma `archivo:línea` es la más precisa y la más estable ante renombrados.

```bash
# 1) Un archivo completo
npm run t -- tests/auth.spec.ts

# 2) Un bloque describe completo
npm run t -- --describe "Cart and checkout"

# 3) Un caso concreto
npm run t -- --test "login with valid credentials"

# 4) describe + caso (el patrón más cómodo)
npm run t -- --describe "Cart and checkout" --test "deleting"

# 5) Por línea exacta (el título cambió pero la línea sigue siendo la correcta)
npm run t -- tests/auth.spec.ts:55
npm run t -- tests/cart-checkout.spec.ts:78
```

---

## 4. Headed vs No headed (headless)

### Qué es cada modo

| | **Headless (no headed)** | **Headed** |
|---|---|---|
| Ventana del navegador | No se ve (Chromium corre en segundo plano) | Visible en el escritorio |
| Velocidad | Más rápido (≈10-20 % menos Overhead de render) | Ligeramente más lento |
| Ideal para | CI/CD, regresiones Nightly, validar el resultado | Depurar, reproducir manualmente, grabar demos, enseñar a negocio |
| Runner por defecto | ✅ sí (es el default) | requiere `--headed` |
| Workers por defecto | los que elija la máquina | **fuerza 1** (estado global compartido del sitio demo) |

### Comandos

```bash
# ---- HEADLESS (por defecto) ----
npm run t                                        # todas
npm run t -- tests/auth.spec.ts                  # un archivo
npm run t -- --test "login with valid"           # un caso
npm run t:list                                   # solo listar

# ---- HEADED ----
npm run t:headed -- tests/auth.spec.ts           # un archivo
npm run t:headed -- --test "login with valid"    # un caso
npm run t -- tests/auth.spec.ts --headed         # equivalente sin atajo
npm test -- --headed                             # suite completa headed (nativo)
```

### Diferencias prácticas que debes conocer (DemoBlaze)

1. **El headed baja a 1 worker automáticamente.** El sitio es un demo público con estado
   compartido (carrito anónimo, usuarios). Con headed la visibilidad se pierde con paralelismo.
2. **Los `alert()` sí se ven en headed** y **no en headless**, pero Playwright los gestiona igual.
   En headed puedes leer el mensaje con tus propios ojos: es la forma más rápida de confirmar
   el mensaje exacto esperado.
3. **El video del modal "About us"** hace polling HLS: en headed se ve la carga, en headless no
   aparece en la UI (la prueba igual valida el reproductor).
4. Si un caso **solo falla en headless**, casi siempre es: espera fija en vez de espera por DOM,
   o aserción dependiente del tamaño de la ventana. Ver §11.

---

## 5. Modos de depuración

```bash
# Modo UI: el más usado por QA. Time Machine, línea a línea, reanudar sólo un caso
npm run t -- --ui
npm run t -- --ui tests/cart-checkout.spec.ts
npm run t:headed -- --ui --test "place order happy path"

# Depurador paso a paso con inspector (PWDEBUG)
npm run t -- --debug
npm run t -- --debug --test "login with a wrong password"

# Cámara lenta (ideal para demos y para grabar evidencia)
npm run t -- tests/catalog.spec.ts --slow-mo 300 --headed
npm run t -- --slow-mo 1000 --test "about us modal"   # 1 s entre acciones

# Equivalente nativo sin el runner (inyecta la variable de entorno directamente)
$env:PW_SLOW_MO=300; npx playwright test tests/catalog.spec.ts
```

| Modo | Cuándo |
|---|---|
| `--headed` | Ver la ejecución "normal" del usuario |
| `--headed --slow-mo 300` | Grabar video/tutorial, demos con negocio |
| `--debug` | Fallo puntual: ejecutar línea a línea con breakpoints |
| `--ui` | Depuración diaria: ver cada aserción y su motivo de fallo |
| `--repeat 3` | Detectar **flakiness** (ver §7) |
| headless | Confirmar que un caso pasa en condiciones de CI |

---

## 6. Catálogo de los 31 casos con comando listo para copiar

Primero, listar (no ejecutar) para ver títulos y líneas actuales:

```bash
npm run t:list
# o, por archivo:
npm run t -- tests/catalog.spec.ts --list
```

### 6.1 `tests/api.spec.ts` — bloque `API` (6 casos)

```bash
npm run t:headed -- tests/api.spec.ts                                   # todos headed
npm run t -- tests/api.spec.ts                                          # todos headless
npm run t -- tests/api.spec.ts --test "GET /entries"                   # uno
npm run t -- tests/api.spec.ts --test "pagination"                      # uno
npm run t -- tests/api.spec.ts --test "bycat"                           # uno
npm run t -- tests/api.spec.ts --test "view returns product"            # uno
npm run t -- tests/api.spec.ts --test "round trip"                      # uno
npm run t -- tests/api.spec.ts --test "rejected by the API"             # uno
```

### 6.2 `tests/auth.spec.ts` — bloque `Authentication` (8 casos)

```bash
npm run t:headed -- tests/auth.spec.ts
npm run t -- tests/auth.spec.ts
npm run t -- tests/auth.spec.ts:9      # sign up a new user shows the success alert
npm run t -- tests/auth.spec.ts:24     # sign up an existing user → "This user already exist."
npm run t -- tests/auth.spec.ts:43     # sign up with empty fields
npm run t -- tests/auth.spec.ts:55     # login with valid credentials shows the welcome user
npm run t -- tests/auth.spec.ts:77     # login with a wrong password
npm run t -- tests/auth.spec.ts:96     # login with a non-existent user
npm run t -- tests/auth.spec.ts:111    # login with empty fields
npm run t -- tests/auth.spec.ts:123    # logout returns the navigation to the anonymous state
```

### 6.3 `tests/cart-checkout.spec.ts` — bloque `Cart and checkout` (5 casos)

```bash
npm run t:headed -- tests/cart-checkout.spec.ts
npm run t -- tests/cart-checkout.spec.ts
npm run t -- tests/cart-checkout.spec.ts:29     # anonymous user can add products …
npm run t -- tests/cart-checkout.spec.ts:53     # deleting an item recalculates the total
npm run t -- tests/cart-checkout.spec.ts:78     # place order happy path (compra completa)
npm run t -- tests/cart-checkout.spec.ts:108    # purchase with empty name or card
npm run t -- tests/cart-checkout.spec.ts:128    # logged-in user (token flow)
```

### 6.4 `tests/catalog.spec.ts` — bloque `Catalog` (6 casos)

```bash
npm run t:headed -- tests/catalog.spec.ts
npm run t -- tests/catalog.spec.ts
npm run t -- tests/catalog.spec.ts:6      # home page loads with carousel, categories and 9 products
npm run t -- tests/catalog.spec.ts:25     # pagination: Next and Previous
npm run t -- tests/catalog.spec.ts:51     # los 3 casos de filtro por categoría (generados)
npm run t -- tests/catalog.spec.ts:70     # hero carousel navigation
npm run t -- --describe "Catalog" --test "Phones"    # solo el filtro Phones
npm run t -- --describe "Catalog" --test "filter by category"   # los 3 filtros
```

### 6.5 `tests/product.spec.ts` — bloque `Product detail` (3 casos)

```bash
npm run t:headed -- tests/product.spec.ts
npm run t -- tests/product.spec.ts
npm run t -- tests/product.spec.ts:7      # opening a product from the catalog …
npm run t -- tests/product.spec.ts:31     # add to cart … shows the success alert
npm run t -- tests/product.spec.ts:47     # product page can be opened directly by id
```

### 6.6 `tests/contact-about.spec.ts` — bloque `Contact and About` (3 casos)

```bash
npm run t:headed -- tests/contact-about.spec.ts
npm run t -- tests/contact-about.spec.ts
npm run t -- tests/contact-about.spec.ts:9     # contact form can be filled and sent
npm run t -- tests/contact-about.spec.ts:23    # about us modal opens with a video player
npm run t -- tests/contact-about.spec.ts:36    # the hero carousel is hidden on small viewports
```

### 6.7 Combinados y por flujo

```bash
# Smoke rápido de UI (sin API) en headless y headed
npm run t -- tests/catalog.spec.ts tests/product.spec.ts
npm run t:headed -- tests/catalog.spec.ts tests/product.spec.ts

# Flujo completo de autenticación
npm run t -- --describe "Authentication"

# Flujo de compra de punta a punta
npm run t:headed -- --describe "Cart and checkout" --test "place order happy path"

# Un caso en headed con cámara lenta (demo)
npm run t:headed -- tests/cart-checkout.spec.ts:78 --slow-mo 500
```

---

## 7. Comandos nativos de Playwright que el runner no expone

Cuando necesites control fino, ve directo a `npx playwright test`:

```bash
# Reintentos: imprescindible para confirmar un fix o destapar un flake
npx playwright test tests/auth.spec.ts -g "login with valid" --retries=2

# Traza SIEMPRE (el config solo graba traza al primer reintento)
npx playwright test tests/cart-checkout.spec.ts -g "place order" --trace on
npx playwright show-trace test-results/*place*/trace.zip     # abrir la traza en el navegador

# Volver a ejecutar sólo lo que falló en la última corrida
npx playwright test --last-failed

# Más timeout para una prueba lenta de red (config: 60 s por test, 10 s de expect)
npx playwright test tests/contact-about.spec.ts --timeout=120000

# Paralelismo y estabilidad
npx playwright test --workers=1          # serie, útil para reproducir fallos de estado compartido
npx playwright test --workers=4
npx playwright test --repeat-each=5      # hunting de flakes

# Dividir la suite (útil en CI con varios agentes)
npx playwright test --shard=1/3
npx playwright test --shard=2/3

# Screenshots/video siempre (no sólo en fallo)
npx playwright test --screenshot=on --video=on

# Cross-browser (requiere npx playwright install firefox)
npx playwright test tests/catalog.spec.ts --project=firefox
npm run t -- tests/catalog.spec.ts --browser firefox --headed
npm run test:firefox                                     # suite completa en Firefox
# El proyecto `webkit` está comentado en playwright.config.ts: descoméntalo e instala
# el binario con `npx playwright install webkit` para habilitarlo.

# Vista móvil en Chrome (proyecto `mobile` = Pixel 7, 412x915, isMobile + hasTouch)
npx playwright test --project=mobile                   # headless
npm run test:mobile                                     # suite completa móvil
npm run t -- tests/auth.spec.ts --browser mobile        # un archivo en móvil
npm run t -- --browser mobile --headed                  # móvil CON navegador visible
npm run t -- --browser mobile --headed --slow-mo 300    # demo en móvil, paso a paso

# Ver reporters alternativos sin abrir el HTML
npx playwright test --reporter=list
npx playwright test --reporter=json > resultados.json
npx playwright test --reporter=dot      # una línea por archivo, salida compacta

# Ver el reporte y los artefactos de la última corrida
npm run report
```

> ⚠️ `--only-changed` **no está disponible**: esta carpeta no es un repositorio Git y Git no está
> instalado en la máquina. Si necesitas esa capacidad, instala Git y ejecuta
> `git init && git add .` una sola vez; a partir de ahí `--only-changed` y `--changed` funcionan
> sobre el working tree.

---

## 8. Reportes y artefactos de evidencia

| Qué | Dónde | Cómo abrirlo |
|---|---|---|
| Reporte HTML | `playwright-report/index.html` | `npm run report` (abre servidor local) |
| Trazas | `test-results/<caso>/trace.zip` | `npx playwright show-trace test-results/<caso>/trace.zip` |
| Screenshots | `test-results/<caso>/test-failed-1.png` | Se abren con doble clic |
| Videos | `test-results/<caso>/video.webm` | Cualquier reproductor (`.webm`) |
| Dashboard local | `dashboard.html` | `npm run dashboard` |

Configuración actual (`playwright.config.ts`): `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`.

**Sugerencia para QA:** cuando entregues evidencia de un bug, ejecuta el caso con

```bash
npx playwright test tests/<archivo>.spec.ts:<linea> --trace on --headed
```

y adjunta el `trace.zip` + el video. Con la traza se ve cada acción, cada red y cada captura
sin necesidad de reproducir en vivo.

> El `dashboard.html` es una copia estática del último `npm test` (los datos están embebidos en
> el `<script id="run-data">`): hay que **volver a editarlos a mano** tras cada corrida.

---

## 9. Variables de entorno

| Variable | Efecto | Ejemplo |
|---|---|---|
| `PW_SLOW_MO` | Milisegundos de pausa entre acciones (lo inyecta `--slow-mo`) | `$env:PW_SLOW_MO=300` |
| `PWDEBUG` | Fuerza el depurador en cualquier ejecución | `$env:PWDEBUG=1; npx playwright test` |
| `PWTEST` | Etiqueta filtrado de red en headed | `$env:PWTEST=1` |
| `CI` | `forbidOnly`, `retries: 2`, `workers: 1` | `$env:CI=1; npx playwright test` |
| `DEBUG=pw:api` | Log detallado de Playwright | `$env:DEBUG="pw:api"; npx playwright test` |

---

## 10. Sugerencias de trabajo para QA (recomendación del proyecto)

### 10.1 Antes de escribir un caso nuevo

1. **Verifica primero en el navegador**: `npx playwright codegen https://demoblaze.com` genera
   el código de Playwright con los selectores reales. La base de conocimiento
   (`demoblaze-knowledge-base.md`) ya tiene el mapa completo: úsala antes de explorar a ciegas.
2. **El flujo ya está encapsulado**: usa Page Objects (`pages/HomePage.ts`, `pages/CartPage.ts`,
   `pages/components/*.ts`) y fixtures (`api`, `uniqueUsername`, `authenticatedPage`) en vez de
   dejar selectores sueltos dentro del test.
3. **No hardcodees productos ni usuarios**: obtén IDs con el fixture `api`
   (`GET /entries`) y usuarios con `uniqueUsername` — el sitio es compartido y los datos fijos
   chocan ("This user already exist.").

### 10.2 Al escribir el caso

4. **Título = paso a paso en inglés, con la aserción clave incluida**, para que el `--grep` localice
   el caso al instante. Ej.: `login with valid credentials shows the welcome user`.
   Títulos vagos como "test1" o "login ok" hacen imposible el filtro y el reporte.
5. **Usa esperas por estado del DOM**, nunca `waitForTimeout` fijo ni `networkidle`
   (este sitio **nunca** alcanza `networkidle` porque Video.js hace polling del HLS).
   Usa `expect(locator).toBeVisible()` con auto-reintento (10 s) y `expect.poll()` para datos que
   llegan por AJAX.
6. **Instala el manejador de diálogos en cuanto el caso pueda disparar un `alert()`**:
   `const dialogs = installDialogHandler(page)`. Sin él, el `alert()` **bloquea** la página y el
   caso se cuelga hasta el timeout. Regla práctica: si no sabes si habrá diálogo, instálalo igual
   (es inofensivo).
7. **Abre siempre la navegación desde `index.html`**: sólo `index.html` asigna la cookie `user`
   del carrito anónimo. Entrar directo a `cart.html` deja la cookie vacía y el carrito se mezcla
   con el de otros usuarios anónimos.
8. **Compara conjuntos, no listas**, cuando valides el carrito: el orden de las filas depende de
   GUIDs aleatorios.
9. **Marca los smoke tests** y mantenlos por debajo de ~10 segundos: son la puerta de entrada de
   la regresión.

### 10.3 Al depurar un fallo

10. **Reproduce en el mismo modo en que falló.** Un fallo que sólo aparece en headed suele ser de
    sincronización visual; uno que sólo aparece en headless suele ser una espera fija.
11. **Abre primero el reporte** (`npm run report`): cada aserción muestra el valor esperado, el
    recibido y un snapshot del momento exacto.
12. **Usa `--ui` con el "Pick locator"** para ver si el elemento existe; si no existe, el problema
    es de la aplicación, no del test.
13. **Distingue flake de bug**: `--repeat-each=5 --retries=0`. Si pasa 4/5, es problema de
    sincronización (arregla la espera). Si falla siempre con el mismo mensaje, es bug del sitio
    (documenta y, si procede, deja el caso en `test.fail()` con el issue de referencia).
14. **Nunca "arregles" un fallo reintentándolo en local**: `--retries` solo debe activarse en CI
    (`process.env.CI`). Un `--retries=3` local esconde el defecto.
15. **Antes de reportar un bug, confirma en headed** y graba la evidencia (§8). Muchos "errores de
    automatización" son realmente la app recargando la página, el token expirando o el
    demo con otro usuario en paralelo.

### 10.4 Cuando añadas casos

16. **Añade el proyecto de Firefox/WebKit** si la cobertura lo exige (reactiva los proyectos
    comentados en `playwright.config.ts` e instala los navegadores).
17. **Mantén `test-results/` y `playwright-report/` fuera del control de versiones**
    (ya están en `.gitignore`) y regenera el dashboard tras la regresión.
18. **Documenta cada caso nuevo** en esta misma guía (§6) y en el README: un caso que no se puede
    ejecutar con un comando documentado es un caso que nadie va a ejecutar.
19. **Para CI**, ejecuta en Linux con `npx playwright install --with-deps chromium` y usa
    `npx playwright show-report` con `--reporter=html,github` (o `blob`) para publicar el
    reporte como artefacto de la ejecución.

---

## 11. Diagnóstico rápido de fallos frecuentes (DemoBlaze)

| Síntoma | Causa probable | Solución |
|---|---|---|
| El caso se queda colgado hasta los 60 s | Un `alert()` sin manejar bloquea el JS de la página | `installDialogHandler(page)` antes de la acción |
| `expect(locator).toBeVisible()` falla en el video | Polling HLS: `networkidle` no llega nunca | Esperar por el reproductor, no por la red |
| Falla al hacer clic en "OK" del SweetAlert | El popup tiene animación de entrada `popIn` | `await expect(...).toBeVisible()` y esperar ~2 s antes del clic |
| El carrito aparece vacío o con datos ajenos | Entrada directa a `cart.html` (cookie `user` vacía) o sesión compartida | Navegar siempre desde `index.html`, con sesión propia |
| El total del carrito no cuadra | Filas del carrito en orden aleatorio (GUIDs) | Comparar conjuntos ordenados |
| Falla la aserción del carrusel | Viewport ≤ 800 px oculta el carrusel por CSS | Usar viewport ≥ 801 px (config: 1280×720) |
| Fallos intermitentes en `--workers>1` | El demo público tiene estado global compartido | `--workers=1` para reproducir; reportar el bug |
| "This user already exist." inesperado | Usuario fijo hardcodeado | Usar el fixture `uniqueUsername` |
| No encuentra el caso con `--test` | Mayúsculas distintas o caracteres especiales | Usar un fragmento en minúsculas del título, o `archivo:línea` |
| `Project(s) "firefox" not found` | El proyecto no está declarado en `playwright.config.ts` | Descomentar el bloque `{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }` |
| Firefox no arranca: `exitCode=255` / `0xC0000409` en `ucrtbase.dll` | **Problema del entorno, no del proyecto**: el binario de Firefox crashea en este equipo incluso fuera de Playwright (ver §14) | Ejecutar en Chromium, o usar la imagen Docker de Playwright / otro equipo |
| 2 fallos de carrusel en `--browser mobile` | **Esperado**: el carrusel se oculta por CSS a ≤ 800 px | No son bugs; ver §13 para las opciones de tratamiento |

---

## 13. Ejecución en vista móvil (Chrome)

El proyecto **`mobile`** de `playwright.config.ts` usa el descriptor `devices['Pixel 7']`
(viewport 412x915, `isMobile: true`, `hasTouch: true`, UA de Android). El viewport de escritorio
(1280x720) del bloque `use` global queda sobrescrito por el descriptor.

```bash
npm run test:mobile                                  # suite completa móvil, headless
npm run t -- --browser mobile --headed               # móvil con navegador visible
npm run t -- --browser mobile --headed --workers 2   # más rápido (ver nota de estado compartido)
npm run t -- tests/cart-checkout.spec.ts --browser mobile --headed
npm run t -- --browser mobile --headed --slow-mo 500 # revisar paso a paso en el emulador
```

**Resultado de referencia (2026-10-13, headed, 1 worker): 29 passed / 2 failed en ~3 min**

| Estado | Casos | Nota |
|---|---|---|
| ✅ 29 pasan | API (6), Authentication (8), Cart and checkout (5), Contact and About (3), Product detail (3), Catalog parcial (4) | La app es **responsive de verdad**: modales, login, carrito y checkout funcionan en 412 px |
| ❌ 2 fallan **por diseño** | `catalog.spec.ts:6` (home carga) y `catalog.spec.ts:70` (navegación del carrusel) | Afirman sobre `#carouselExampleIndicators`, que el CSS oculta a ≤ 800 px |

> No son bugs de la app ni de la suite: son **aserciones de escritorio**. La propia base de
> conocimiento lo avisa (§7: *"El carrusel se oculta en viewports ≤ 800 px"*), y ya existe un caso
> móvil explícito que lo cubre: `contact-about.spec.ts:36` → *"the hero carousel is hidden on
> small viewports"* ✅ pasa en móvil.
>
> **Cómo tratar estos 2 casos:** opción (a) dejarlos así y siempre correr la suite de escritorio
> para regresión y la móvil como cobertura adicional (recomendado); opción (b) makinglos
> responsive-aware con `test.skip(({ viewport }) => (viewport?.width ?? 1280) <= 800, 'carousel oculto en movil')`
> para que el proyecto `mobile` quede en verde.

**Ejemplo de caso responsive-aware** (si eliges la opción b):

```ts
test.beforeEach(async ({ page }) => {
  test.skip(
    (page.viewportSize()?.width ?? 1280) <= 800,
    'El carrusel hero se oculta por CSS a <= 800 px',
  );
});
```

### Otros viewports sin tocar el config

```bash
# Tablet y otros tamaños arbitrarios con la CLI nativa (sobrescribe el viewport del config)
npx playwright test --project=chromium --viewport-size=768,1024 --headed
npx playwright test --project=chromium --viewport-size=375,667 --headed   # iPhone SE
npx playwright test --project=chromium --device="iPhone 13" --headed      # descriptor completo
```

---

## 14. Problema conocido: Firefox no arranca en esta máquina (2026-10-13)

**Síntoma**

```
browserType.launch: Failed to launch the browser process.
<process did exit: exitCode=255>            # o 0xC0000409 tras ~180 s

Evento de Windows (Application, id 1000):
  Aplicación con errores: firefox.exe 157.0.0.783
  Módulo con errores:  ucrtbase.dll 10.0.26100.9444
  Código de excepción:  0x0000000000000409
```

**Diagnóstico realizado**

| Comprobación | Resultado |
|---|---|
| `npx playwright install firefox` | ✅ descarga OK (Firefox 157.0, 123.8 MiB) |
| Suite de auth en `--project=firefox` | ❌ timeout de lanzamiento (180 s) |
| Lanzamiento directo `firefox.launch()` | ❌ `exitCode=255` |
| Firefox **fuera** de Playwright: `firefox.exe --headless --screenshot https://example.com` | ❌ `exitCode=255`, no genera PNG |
| Sistema | Windows 11 Home Single Language, build 26200, x64 |
| `mfplat.dll`, `mf.dll`, `dwrite.dll`, `d3d11.dll` (Media Foundation) | ✅ presentes |
| Segundo antivirus/EDR | ❌ solo Windows Defender |

**Conclusión:** el binario de Firefox revienta dentro de `ucrtbase.dll` (C Runtime) incluso en un
lanzamiento trivial, así que **no es un problema de la suite ni de Playwright, sino de la
combinación Firefox 157 + este equipo**. Chromium funciona con normalidad.

**Opciones para resolverlo (en orden de coste)**

1. **Reparar el C Runtime de Windows** (requiere Administrador):
   ```powershell
   DISM /Online /Cleanup-Image /RestoreHealth
   sfc /scannow
   ```
2. **Excluir la carpeta de navegadores de Defender** (Control de Acceso a Carpetas / reglas ASR):
   `C:\Users\ALVAREZ\AppData\Local\ms-playwright\`
3. **Reinstalar el binario**: `npx playwright install --force firefox`
4. **Probar una build anterior de Firefox** de Playwright (más compatible con UCRT antiguo):
   `npm i @playwright/test@1.49.0 && npx playwright install firefox`
5. **Ejecutar el cross-browser en Docker** (vía soportada oficialmente, evita el problema de UCRT):
   ```bash
   docker run --rm -v "%CD%:/w" -w /w mcr.microsoft.com/playwright:v1.64.0-noble \
     npx playwright test --project=firefox --reporter=html
   ```
6. **Mientras tanto, ejecutar en Chromium** — la suite completa ya está cubierta ahí
   (`npm test` usa `--project=chromium` explícitamente para que el default no cambie).

---

## 12. Cheat sheet

```bash
# ── Listar ─────────────────────────────────────────────────────
npm run t:list

# ── Individual: headless ───────────────────────────────────────
npm run t -- tests/auth.spec.ts
npm run t -- tests/auth.spec.ts:55
npm run t -- --test "login with valid"
npm run t -- --describe "Cart and checkout"

# ── Individual: headed ─────────────────────────────────────────
npm run t:headed -- tests/auth.spec.ts:55
npm run t:headed -- --describe "Cart and checkout" --test "place order"

# ── Depurar ────────────────────────────────────────────────────
npm run t -- --ui
npm run t -- --debug
npm run t -- tests/catalog.spec.ts --headed --slow-mo 300

# ── Confirmar / evidencia ──────────────────────────────────────
npx playwright test tests/<archivo>.spec.ts:<linea> --retries=2 --trace on --headed
npm run report

# ── Global ─────────────────────────────────────────────────────
npm test                    # headless
npm run test:headed         # headed
npx playwright test --last-failed
```

---

*Documento de referencia para QA — manténlo actualizado cuando añadas, renombres o elimines casos.
 Fuente funcional: [`../demoblaze-knowledge-base.md`](../demoblaze-knowledge-base.md).*