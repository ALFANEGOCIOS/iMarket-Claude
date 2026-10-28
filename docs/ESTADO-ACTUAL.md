# Estado actual del proyecto (checkpoint)

## 🆕 Migración a shadcn/ui real — EN CURSO, requiere `npm install`

Se reemplazaron los componentes falsos (`components/ui/*.jsx`, que antes
eran divs con clases CSS propias imitando la API de shadcn) por los
componentes **reales** de shadcn/ui, construidos sobre Radix UI de verdad.
**Antes de volver a correr el proyecto hay que ejecutar `npm install`** —
se agregaron dependencias nuevas a `package.json` que todavía no están
descargadas: `@radix-ui/react-*` (avatar, dialog, dropdown-menu, label,
select, separator, slot, switch, tabs), `class-variance-authority`, `clsx`,
`tailwind-merge`, `sonner`.

Lo que se hizo:
- `lib/utils.js`: la función `cn()` ahora es la real (clsx + tailwind-merge).
- `app/globals.css`: se agregó un bloque `@theme inline` que registra las
  variables de color (`--primary`, `--background`, etc.) como colores de
  Tailwind v4, así `bg-primary`, `text-foreground`, `border-border` etc. ya
  funcionan como clases de utilidad y responden solas al modo oscuro.
- **Todos** los primitivos se reescribieron con el código real de shadcn
  (estilo "new-york"): Button, Card, Input, Label, Textarea, Badge,
  Separator, Avatar, Switch, Alert, Skeleton, Dialog, Tabs, Dropdown Menu,
  Select, Sheet, y el Toaster de `sonner`.
- **`components/modal.js`**: se reescribió como un envoltorio delgado sobre
  el `Dialog` real de Radix, manteniendo exactamente la misma firma de
  props (`title`, `children`, `onClose`, `wide`) — así las ~650 líneas de
  contenido de los modales en `marketplace.js` NO tuvieron que tocarse ni
  una línea, solo cambió el motor de abajo.
- **El sistema de toast propio** (estado `toast`/`setToast`, temporizador
  manual) se eliminó de `marketplace.js` y se reemplazó por `toast()` de
  `sonner`, montado globalmente en `app/layout.js`.
- **Las pestañas del panel de admin** (`components/live-panels.js`,
  `AdminPanel`) se migraron de botones hechos a mano a `Tabs`/`TabsList`/
  `TabsTrigger`/`TabsContent` reales de Radix — el contenido de cada
  pestaña (Resumen, Identidades, Anuncios, Destacados, Usuarios, Reportes,
  Ventas) no cambió, solo el mecanismo de navegación.
- `login`, `registro` y `dashboard` ya importaban `Button`/`Card`/`Input`/
  `Label` desde estas mismas rutas, así que heredan los componentes reales
  automáticamente sin haber tenido que tocar esas páginas.

**No pude correr `npm install` ni un build real** (este entorno no tiene
acceso a internet), así que todo esto se escribió con cuidado pero sin la
verificación final de un build exitoso. Validé a mano que cada archivo
tiene las llaves/paréntesis balanceados, pero **la primera vez que corras
`npm run dev` después de `npm install` puede aparecer algún error puntual
de JSX que no detecté** — avísame si pasa y lo arreglo.

### 🔧 Arreglo del modo oscuro "a parches" (partes blancas/negras mezcladas)

Causa real: convertir los componentes (`Button`, `Dialog`, `Tabs`...) a
shadcn no alcanza por sí solo — el resto de `marketplace.js` seguía
pintado con ~228 colores hex **fijos** de una sesión anterior (cuando
pasé la paleta de verde a azul), que no tienen ninguna relación con
`.dark`. Por eso el admin (ya migrado a componentes reales) se veía bien
y el resto de la página quedaba a medias.

Se corrigió con un barrido automático: cada color hex del archivo (fuera
de los bloques `:root`/`.dark`/`@theme`) se clasificó por su matiz y
luminosidad (mismo método que usé para pasar de verde a azul) y se
reemplazó por la variable semántica que le corresponde
(`var(--card)`, `var(--foreground)`, `var(--border)`,
`var(--muted-foreground)`, `var(--primary)`, `var(--accent)`,
`var(--destructive)`). Resultado: **221 de 228 colores** quedaron
tokenizados; solo sobraron 7 (sombras muy sutiles con transparencia y un
par de verdes de success-state) que no encajaban con confianza en
ninguna categoría y se dejaron igual a propósito, para no adivinar mal.

También quedaron **sin uso** (dead CSS, no rompen nada pero se pueden
borrar después) las reglas `.button.dark`, `.button.primary`,
`.small-button`, `.ghost-button`, `.danger-button`, `.inline-link`,
`.text-button` — ya no las usa ningún componente porque se convirtieron
a `<Button>` real.

### Botones migrados a `<Button>` real

Se convirtieron automáticamente (con un script que empareja cada
`<button>` con su `</button>` correspondiente, cuidando que no se
puedan anidar entre sí) **30 botones** en `marketplace.js`,
`live-panels.js` y `publish-form.js` que antes usaban las clases
propias, mapeados así:
- `small-button` → `variant="outline" size="sm"`
- `ghost-button` / `logout-button` → `variant="ghost" size="sm"`
- `danger-button` → `variant="destructive" size="sm"`
- `button dark` → `variant="default"` (ahora sí usa el azul de marca,
  antes tenía un negro fijo hardcodeado que ni seguía la paleta)
- `button primary` → `variant="secondary"`
- `inline-link` / `text-button` → `variant="link"`

Quedaron **27 botones sin convertir** en `marketplace.js` — son botones
de solo ícono (cerrar, favorito, mostrar/ocultar contraseña, etc.) con
posicionamiento muy específico; no los toqué porque mapearlos a
variantes de `<Button>` genéricas podía romper su posicionamiento sin
ganar nada visualmente.

### 🆕 Segunda pasada — conversión COMPLETA, no solo lo fácil

El usuario pidió explícitamente no dejar partes sueltas sin shadcn para no
tener problemas de mantenimiento a futuro. Esta pasada cubrió todo lo que
quedaba:

- **Componentes nuevos que no existían**: `Slider`, `Tooltip`, `Checkbox`,
  `ScrollArea` (con su `ScrollBar`). Se agregaron sus dependencias de Radix
  a `package.json` (`@radix-ui/react-slider`, `-tooltip`, `-checkbox`,
  `-scroll-area`).
- **Todos los `<select>` nativos** (9 en total: modelo, almacenamiento,
  condición, tipo de batería y municipio en publicar; batería mínima,
  municipio y ordenar en el buscador; calificación en reseñas; municipio en
  ajustes de cuenta; motivo en reportes) → `Select`/`SelectTrigger`/
  `SelectValue`/`SelectContent`/`SelectItem` reales. Como el `Select` de
  Radix no es un `<select>` nativo, los formularios que antes leían estos
  campos con `FormData` se cambiaron a estado controlado de React — la
  lógica de envío sigue haciendo lo mismo, solo cambió de dónde lee el
  valor.
- **Todos los `<textarea>` nativos** (6) → `Textarea`.
- **Todos los `type="checkbox"`** (12, contando los filtros del buscador,
  el formulario de publicar y el de verificación) → `Checkbox`.
- **El slider de precio del buscador** (`<input type="range">`) → `Slider`
  real de Radix.
- **El scroller de mensajes** (`.message-thread`, donde se leen los
  mensajes de una conversación) → `ScrollArea` real en vez de
  `overflow: auto` a mano.
- **Badges de estado** ("Nuevo", "Por revisar", "Vendido", "Confirmada")
  → `Badge` real, con la variante que mejor describe cada estado
  (`secondary` para completado/confirmado, `outline` para pendiente).
- Todos los inputs de texto sueltos que quedaban (nombre, teléfono,
  precio, color, batería, barrio, fotos) → `Input`.

### Lo que sigue sin tocar, a propósito

- **Los ~27 botones de solo ícono** (cerrar, favorito, mostrar/ocultar
  contraseña, flechas de galería) — no los convertí a `<Button>` porque
  tienen posicionamiento muy específico (absolutos sobre imágenes, etc.)
  y convertirlos no mejora nada visualmente, solo agrega riesgo.
- **El `ThemeToggle`** sigue siendo un botón propio en vez de un
  `Switch`. Es una decisión de gusto, no de arquitectura — dime si lo
  quieres como `Switch`.
- **Tooltip**: el componente ya existe y está listo para usarse, pero
  todavía no lo conecté a ningún botón específico (no estaba claro en
  qué botones concretos lo querías — iconos de favoritos, destacado,
  etc.). Dime en cuáles y los agrego.
- Las páginas estáticas viejas (`*.html`, `css/`, `js/` sueltos en la
  raíz) siguen ahí sin tocar — no son parte del build de Next, son
  sobras del prototipo original.

### 🆕 Páginas de contenido: Cómo funciona, Términos, Seguridad + FAQ

Se crearon tres páginas nuevas (`app/como-funciona/`, `app/terminos/`,
`app/seguridad/`), con contenido real basado en el funcionamiento del
producto (verificación de identidad, revisión de anuncios antes de
publicar, teléfono privado, encuentro en persona, confirmación de venta
por el comprador, etc.) — no es texto genérico de plantilla. La página de
Seguridad incluye la sección de FAQ pedida, con el `Accordion` real de
shadcn (nuevo componente, se agregó `@radix-ui/react-accordion` a
`package.json`).

De paso se encontraron y arreglaron **6 botones que no llevaban a ningún
lado**: en el menú, los beneficios de la portada, el pie de página, el
formulario de registro y el detalle de un anuncio había botones que
abrían un modal (`setModal("how"/"terms"/"safety")`) sin que existiera
ningún contenido para ese modal — quedaban en blanco. Ahora los seis
llevan a las páginas reales. También se corrigió el link del registro
que apuntaba a `/terminos.html` (el archivo estático viejo, vacío).

### Lo que falta de esta migración
- Reemplazar los botones/inputs sueltos del resto de `marketplace.js`
  (que siguen usando clases CSS propias como `.small-button`,
  `.ghost-button`, `.danger-button`) por los componentes `<Button>` reales
  con sus variantes (`variant="outline"`, `variant="destructive"`, etc.).
  Hoy conviven ambos sistemas — visualmente son parecidos pero no son el
  mismo componente todavía.
- El `ThemeToggle` actual sigue siendo un botón propio (sol/luna); se
  podría migrar a usar `<Switch>` de shadcn en vez de un botón si se
  prefiere ese estilo.
- Quedó una clase `.admin-tabs` en `globals.css` que ya no se usa (la
  dejó el cambio a `Tabs` reales) — no rompe nada, pero se puede borrar
  después para no dejar CSS muerto.
- El padding visual de los modales cambió levemente: antes el header
  tenía su propio padding separado del cuerpo; ahora el `Dialog` real
  aplica un padding único a toda la tarjeta. Funciona igual, pero puede
  verse con un poco más de aire del que tenía antes.

Este archivo resume en qué quedó todo tras la última sesión de trabajo, para
retomarlo sin perder contexto.

## ✅ Hecho y verificado en vivo contra Supabase (jlolyhglduixwjjngcuk)

- **Panel de administración completo**: Resumen (métricas), Identidades,
  Anuncios, Usuarios (suspender/banear/dar rol), Reportes (resolver/descartar),
  Ventas. Accesible en `/dashboard`.
- **Confirmación de compra por el comprador**: el vendedor vincula al
  comprador real (solo si hubo conversación sobre ese anuncio) y el comprador
  confirma. Incrementa `profiles.total_sales` correctamente (probado
  end-to-end, incluida la cadena de triggers protegidos).
- **RLS reforzado**:
  - `listing_images` ya no era visible para cualquiera sin importar el estado
    del anuncio (pendiente/rechazado). Corregido.
  - El admin ahora puede leer `profile_private` (teléfono/dirección) para dar
    soporte o resolver reportes serios.
  - El admin ahora puede leer `user_roles` de cualquiera (antes solo lo propio).
- **Probado end-to-end por SQL** (y luego limpiado): verificación de
  identidad → publicar → mensaje → venta → confirmación → reseña → reporte →
  acciones de admin. Todo funcionó sin errores. Quedaron dos cuentas de
  prueba activas: `prueba@mail.com` (admin) y `comprador.prueba@mail.com` /
  `Prueba123!` (comprador, sin rol).
- **Colores**: toda la paleta verde-oliva se convirtió a azul/blanco/negro en
  `app/globals.css` (y en `app/icon.svg`).
- **Botón de admin en la página principal**: ya existía (`router.push("/dashboard")`
  dentro del panel de perfil) — se confirmó que funciona, no hubo que
  construirlo. Se eliminó un modal de admin duplicado que había quedado sin
  usar (código muerto) en `components/marketplace.js`.
- **Backend de "destacar anuncios"**: columna `listings.featured_at` +
  función `imarket_admin_set_featured(listing_id, featured)`, ya aplicada en
  Supabase.
- **Backend de notificaciones**: tabla `messages` añadida a la publicación
  `supabase_realtime`; `repository.unreadMessages(userId)` en
  `lib/database.mjs`; el hook `use-remote-marketplace.js` ya carga `unread` al
  iniciar sesión y se suscribe en tiempo real a mensajes nuevos (dispara un
  refresco cuando alguien más te escribe); al cerrar el inbox se refresca el
  contador.

## ✅ Hecho en la sesión de continuación (shadcn + notificaciones + admin)

- **Campana de notificaciones**: ícono con badge en el header
  (`components/marketplace.js`), toast cuando llega un mensaje nuevo
  mientras navegas, se limpia al cerrar el inbox. Usa
  `repository.unreadMessages()` + la suscripción Realtime ya armada en
  `hooks/use-remote-marketplace.js`.
- **Restablecer contraseña — arreglado**: `app/login/page.js` ahora
  detecta el evento `PASSWORD_RECOVERY` de Supabase Auth y muestra un
  formulario para poner la nueva contraseña (`updateUser`) en vez de
  redirigir de inmediato. **Falta probarlo en el navegador real** — no se
  pudo verificar aquí porque depende del enlace que llega por correo.
- **Destacar anuncios — interfaz completa**: pestaña "Destacados" en el
  panel de admin (`components/live-panels.js`) con botón
  destacar/quitar sobre los anuncios publicados, y una franja "Destacados"
  en la página principal (`components/marketplace.js`) que solo aparece si
  hay anuncios marcados. Usa `repository.adminListings()` y
  `repository.adminSetFeatured()`.
- **Modo claro/oscuro — funcional en login, registro y dashboard**:
  - Se unificaron los dos bloques `:root` que competían en
    `app/globals.css` en uno solo, con `--primary` en azul de marca, y se
    agregó el bloque `.dark` completo.
  - Todos los componentes `ui-*` (`.ui-button`, `.ui-card`, `.ui-input`,
    etc.) ahora usan esas variables en vez de colores hex fijos, así que
    responden automáticamente al modo oscuro.
  - `components/theme-toggle.js`: botón sol/luna que guarda la preferencia
    en `localStorage` y la aplica con una clase `.dark` en `<html>`.
  - `app/layout.js`: script inline que aplica el tema guardado (o el del
    sistema operativo si nunca se eligió uno) antes de que React hidrate,
    para evitar el parpadeo de claro→oscuro al cargar.
  - El botón ya está en el header de la página principal y del dashboard.
    **Falta agregarlo a `/login` y `/registro`** (quedó fuera por tiempo,
    no por dificultad).
- **Letras más grandes**: `html` subió a 17px base y `body` de 14px a
  15px en `app/globals.css`. Esto afecta todo lo que usa `rem` o hereda
  el tamaño base; **los textos en px fijos pequeños (9-11px) que yo mismo
  dejé en el panel de admin en una sesión anterior siguen igual de
  pequeños** — no se tocaron uno por uno todavía.
- **Gráfico de ventas en el dashboard**: hecho, SVG propio sin
  dependencias nuevas (nada de `npm install` pendiente). Está en la
  pestaña "Resumen" del panel de admin, agrupa las ventas confirmadas por
  mes (últimos 6 meses) y muestra el total en USD. Usa los datos que ya
  trae `repository.adminSales()`.

## ❌ Pendiente

1. **Aplicar el estilo shadcn al resto de la página principal** — sigue
   siendo la tarea más grande. `components/marketplace.js` (~1850 líneas)
   todavía usa en su mayoría las clases CSS propias de antes (colores hex
   literales, no las variables `--primary`/`--card`/etc.), salvo el header
   y la franja de destacados que se tocaron en esta sesión. Por eso el
   modo oscuro, aunque ya funciona de verdad en login/registro/dashboard,
   todavía se va a ver "a medias" en el resto de la página principal
   (el fondo y la cabecera cambian, pero tarjetas/modales/formularios más
   abajo seguramente no).
2. **Letras pequeñas puntuales** — terminar de subir los tamaños de fuente
   fijos (9-11px) que quedaron en el panel de admin.
3. **Toggle de tema en /login y /registro** — el componente ya existe,
   falta importarlo ahí.
4. **Probar restablecer contraseña y creación de cuenta en el navegador
   real** — ambos flujos están implementados y la lógica de base de datos
   se validó por SQL, pero ninguno se probó haciendo clic de verdad (uno
   depende de un correo real, el otro de la configuración de Auth/SMTP de
   Supabase, que no se puede inspeccionar desde aquí).

## Notas técnicas para quien retome esto

- `components.json` declara shadcn "new-york" con color base zinc, pero
  `components/ui/*.jsx` **no son los componentes reales de shadcn** (no usan
  Radix ni `class-variance-authority`, que ni siquiera están en
  `package.json`): son una reimplementación ligera a mano que imita la API
  (Button, Card, Input, Label, Badge, Separator) con clases CSS propias
  (`ui-button`, `ui-card`, etc.) definidas al final de `app/globals.css`.
  Funciona, pero conviene saberlo antes de pedir "componentes de shadcn" que
  no van a estar ahí literalmente.
- Las credenciales de Supabase en `.env.local` apuntan al proyecto real
  (`jlolyhglduixwjjngcuk`), en modo `live`.

---
## Actualización (última tanda)
**Hecho**
- Paleta de marca (#3B82F6 / #0B0B0F / #F8FAFC) y tipografía Montserrat en todo el proyecto, modo claro y oscuro con tokens (sin blancos/negros sueltos); texto más oscuro.
- Icono nuevo (`app/icon.svg`); HTML/CSS/JS antiguos y fuentes Manrope eliminados.
- Modelos de iPhone 6 → 18 en publicar y en filtros (X incluye XS/XR); almacenamiento desde 16 GB.
- Filtros Modelo / Almacenamiento / Condición con `Accordion` de shadcn (Modelo cerrado por defecto → página más corta); tamaños de letra de filtros unificados; slider de precio arreglado.
- `Skeleton` de shadcn en lugar de "Cargando iPhones…".
- Páginas Cómo funciona, Términos, Seguridad + FAQ.

**Pendiente**
- Configurar Google OAuth y magic link en Supabase (+ botones en login/registro).
- Logo (icono) ya en cabecera, pie y auth; falta wordmark completo en SVG y favicon definitivo.
- Revisar en navegador: modo oscuro completo, admin, y la migración SQL de modelos 6→18 si no está aplicada.
- Pre-lanzamiento: SMTP propio, política de privacidad, página 404, SEO/OG, límites de uso, analítica.
- Probar `npm install && npm run dev` (no pude compilar aquí).

---
## Cambio: sin modo claro/oscuro
- Se eliminó por completo el modo oscuro y el botón de tema (`theme-toggle.js`, script de tema, bloque `.dark`). La web usa solo la paleta de marca: #3B82F6, #0B0B0F, #F8FAFC y Montserrat.
- Panel de administración: pestañas (Resumen, Identidades, Anuncios, Destacados, Usuarios, Reportes, Ventas) ahora se acomodan sin solaparse; fondo de marca, texto más oscuro y logo en la barra.
- Limpieza de colores: los colores fijos restantes son solo sombras neutras, el verde de estado "éxito" y los colores de producto (rosa/verde del iPhone). Se eliminó el CSS muerto del icono antiguo, el punto del nombre, `.admin-tabs` y el botón de tema. Páginas Cómo funciona/Términos/Seguridad usan el logo.
- Filtros en móvil: ahora son una hoja a pantalla completa que sube desde abajo, con encabezado fijo (cerrar y Limpiar), contenido con scroll y botón "Ver N resultados" fijo abajo; bloquea el scroll de fondo y cierra con Escape.
- Casillas, campos y bordes de formularios más visibles en toda la web (escritorio, móvil y dashboard): bordes más oscuros y casillas de 20 px; las casillas de términos ahora usan el Checkbox de shadcn.
- Ventanas (publicar, detalle, etc.) en móvil: pantalla completa, sin desplazamiento lateral, formulario en una columna, botón cerrar fijo. En escritorio no cambia.

---
## Dashboard rediseñado (estilo "Panel del vendedor")
- Barra lateral oscura con logo, navegación (Resumen, Identidades, Anuncios, Destacados, Usuarios, Reportes, Ventas) con contadores de pendientes, y datos del administrador + Salir.
- Resumen: 4 tarjetas (ventas del mes con variación vs. mes anterior, ventas confirmadas, anuncios publicados, usuarios), gráfica de ventas con selector 7/30/90 días y pico, modelos más vendidos, ventas recientes y "Por atender" (identidades, anuncios por revisar, reportes, ventas sin confirmar; cada fila abre su pestaña).
- Todo se calcula con datos reales de Supabase (ventas confirmadas, anuncios, reportes). En móvil la barra lateral pasa arriba como menú horizontal.
- No hay datos de pedidos/envíos/disputas/IMEI como en el PDF de muestra: no existen en el proyecto todavía.
- Skeleton de carga: ahora aparece debajo de la barra de búsqueda, en el lugar de los anuncios (antes salía encima).
- Destacados rediseñados: vitrina con tarjeta principal grande (foto, precio, vendedor verificado, "Ver iPhone" y "Escribir al vendedor"), 2 tarjetas laterales, paginador 1/N con rotación automática y botón "¿Quieres destacar tu iPhone?" (por ahora abre el formulario de publicar; falta definir el flujo real de pago/promoción). Archivo: components/featured-showcase.js
- Corrección móvil: las ventanas (detalle de anuncio, publicar) se desplazaban a un lado por la propiedad translate de Tailwind v4; ahora ocupan la pantalla completa y se pueden desplazar.
- Móvil: se eliminó el desbordamiento horizontal de la página (botones del hero "Encuentra tu iPhone / Quiero vender" ensanchaban la pantalla y dejaban las ventanas cortadas y corridas). html/body con overflow-x: clip.
- Ventanas: se quitó el centrado con translate (se aplicaba dos veces y dejaba la ventana corrida a la izquierda); ahora se centran con inset-0 + m-auto y en móvil ocupan toda la pantalla. El pie muestra "v18-oct" para comprobar que se desplegó esta versión.
- Detalle del anuncio: la foto principal se adapta al ancho (altura entre 190 y 310 px, imagen contenida), así no tapa las miniaturas en pantallas muy pequeñas. Marca de versión: v18-oct-b.
- Restablecer contraseña: antes de enviar el correo se comprueba que exista una cuenta con ese correo (función SQL imarket_email_registered, ya aplicada en Supabase; copia en supabase/migrations_email_registered.sql). Si no existe, se muestra "No existe ninguna cuenta registrada con ese correo." y no se envía nada. Nota: esto permite saber si un correo está registrado (enumeración de cuentas); aceptado a propósito. Marca de versión: v26-oct.
- Límite de intentos en la comprobación de correo (5 por IP cada 10 min): SQL en supabase/migrations_email_rate_limit.sql — PENDIENTE de ejecutar en Supabase SQL Editor (la aplicación automática se canceló). La web ya muestra "Demasiados intentos" cuando se aplique.
- Restablecer contraseña: ya no inicia sesión sola. La página detecta el enlace del correo (type=recovery) antes de revisar sesiones, muestra siempre el formulario de nueva contraseña, y al guardarla cierra la sesión temporal y pide iniciar sesión con la contraseña nueva. Incluye botón "Cancelar" (cierra la sesión temporal) y mensaje si el enlace expiró. Marca: v27-oct.
- Antigüedad de anuncios: función timeAgo (lib/catalog.mjs). Menos de 1 h "Ahora", hasta 23 h en horas, desde 24 h en días ("Hace 3 d" en tarjetas, "Publicado hace 3 días" en el detalle), desde 30 días en meses. Usada en tarjetas, detalle y destacados. Marca: v28-oct.
- Vistas por anuncio: la web cuenta una vista por persona cada 24 h (el vendedor no cuenta) y la muestra en las tarjetas (ojo + número) y en el detalle. Requiere ejecutar supabase/migrations_listing_views.sql en Supabase SQL Editor — PENDIENTE (la aplicación automática se canceló). Sin ese SQL el contador se queda en 0. Marca: v29-oct.

## v30-oct — Notificaciones (campanita)
- Causa: el botón de la campana no tenía `position: relative`, así que el contador (posición absoluta) quedaba fuera del icono. Corregido en `globals.css` (`.notifications-nav`), con insignia azul de marca y tope "9+".
- Nuevo `refreshUnread()` en `use-remote-marketplace.js`: recarga solo los mensajes sin leer (sin reiniciar toda la sesión). Se dispara por Realtime (INSERT y UPDATE en `messages`), al volver a la pestaña/enfocar y cada 30 s como respaldo; también al cerrar la bandeja.

## v31-oct — Dashboard: Anuncios y Pendientes
- Pestaña **Anuncios**: lista los iPhone publicados (con Destacar/Quitar y **Eliminar** con motivo). Sustituye a la antigua pestaña "Destacados".
- Pestaña nueva **Pendientes**: cola de revisión (aprobar o rechazar con motivo), con contador en el menú lateral.
- Nueva RPC `imarket_admin_remove_listing` (eliminación lógica, status `deleted`, queda en el historial de moderación). Ya aplicada en Supabase; SQL en `supabase/migrations_admin_remove_listing.sql`.

## v32-oct — Términos y condiciones
- `/terminos` ya existía (enlazada desde el pie, el registro y Seguridad). Se amplió a 12 secciones (conductas no permitidas, destacados, limitación de responsabilidad, eliminación de cuenta) y la fecha de actualización ahora es fija.

## v33-oct — Daños estéticos al publicar
- Nuevo campo opcional "Daños estéticos" (casillas): cristal trasero dañado, cristal delantero dañado, mancha en pantalla, rayas en pantalla, marco golpeado. Se guarda en `listings.cosmetic_issues` (text[] con CHECK). La condición estética (Como nuevo/Excelente/Buen estado) se mantiene.
- `imarket_create_listing` actualizada para validar y guardar el campo (migración ya aplicada en Supabase).
- Se muestran como etiquetas en el detalle del anuncio y en la revisión del admin.

## v34-oct — Tipo de batería
- Nueva opción "Reemplazada / original" (batería cambiada por una pieza original) además de "Original" y "Genérica / reemplazada". Valor de enum `replaced_original` añadido a `listings.battery_type` (migración ya aplicada en Supabase). El detalle muestra "Reemplazada (original)" o "Reemplazada (genérica)".

## v35-oct — Colores por modelo
- El campo Color al publicar ahora es una lista que depende del modelo elegido (sin texto libre); al cambiar de modelo se reinicia. Catálogo en `lib/iphone-colors.mjs` (fuentes: Apple Newsroom/especificaciones para 17e, 18 Pro/Max y Duo; guías de colores de Apple/MacRumors para el resto). Para añadir un modelo o color nuevo, editar ese archivo.
- iPhone SE reúne los colores de sus tres generaciones. Los anuncios ya publicados no cambian. Validación solo en el formulario (el servidor acepta cualquier texto de color).

## v36-oct — Colores desde la base de datos
- Nueva tabla `public.iphone_colors (model, color, position)` con lectura pública; el formulario carga los colores de ahí y usa `lib/iphone-colors.mjs` solo como respaldo si la tabla aún no existe.
- `imarket_create_listing` valida en el servidor que el color exista para el modelo (error `IMARKET_INVALID_COLOR`).
- **PENDIENTE: ejecutar `supabase/migrations_iphone_colors.sql` en el SQL Editor de Supabase** (la aplicación automática fue cancelada). Hasta entonces todo sigue funcionando con la lista local, sin validación en servidor.
- Para añadir un color/modelo nuevo: `insert into public.iphone_colors values ('iPhone 18', 'Negro', 1);`

## v37-oct — Avisos por correo
- Ruta `app/api/notify/route.js` (Next.js, Node) envía el correo con **Gmail + nodemailer** (sin dominio propio). Protegida con cabecera secreta `x-notify-secret`.
- `supabase/migrations_email_notifications.sql`: extensión `pg_net`, triggers en `messages` (máx. 1 aviso/10 min por conversación), `listings` (aprobado/rechazado) y `verification_requests` (aprobada/rechazada), y preferencia por usuario (casilla en "Editar mis datos").
- Configuración manual necesaria: (1) variables en Vercel `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `NOTIFY_SECRET`, `NEXT_PUBLIC_SITE_URL`; (2) ejecutar el SQL; (3) insertar `notify_url` y `notify_secret` en `private.app_settings` (instrucciones al final del SQL). Sin esto no se envía nada y la web funciona igual.
- Límite de Gmail: ~500 correos/día. Si crece, migrar a un servicio con dominio propio (Resend/Brevo).

## v38-oct — Subida de documentos de identidad (y fotos de anuncios)
- Causa probable: `compressPhoto` pedía WebP al canvas; **Safari de iPhone no codifica WebP y devuelve PNG**, y `uploadDataImages` rechazaba cualquier blob que no fuera WebP ("Invalid processed image"), que a su vez se mostraba como un error genérico. Afectaba a quien sube desde iPhone.
- Corrección: si el navegador no produce WebP se usa JPEG (el bucket lo admite); la ruta usa `.webp` o `.jpg` según el tipo real.
- Los errores de foto ahora muestran un mensaje claro (formato/peso/permisos) en vez del genérico.
- Políticas de Storage y RPC `imarket_request_verification` revisadas: correctas (solo permiten subir a `verification-private` a cuentas sin verificar y no suspendidas, en la carpeta del propio usuario).

## v39-oct — Botón "Panel" para admin
- En la cabecera de la página principal, los administradores ven un botón "Panel" (solo icono en móvil) que lleva a `/dashboard`. Sigue existiendo el acceso desde el perfil. Visible solo si `remote.isAdmin` (rol `admin` en `user_roles`).
