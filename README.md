# iMarket

Marketplace de iPhones entre propietarios de La Habana. Next.js App Router, React, Tailwind CSS y cliente Supabase. El código se ha adaptado a las tablas entregadas por el propietario; **se confirmó acceso de lectura a su estructura; todavía no se ha modificado**.

## Ejecutar

Node.js 24 y npm 11:

```sh
npm ci
npm run dev
```

Abrir http://localhost:3000. Para producción:

```sh
npm run build
npm start
```

Comprobaciones: `npm test`, `npm run lint`, `npm run build`.

## Dos modos

### Demo

Sin configuración, o con `NEXT_PUBLIC_APP_MODE=demo`, se conserva el prototipo con anuncios ficticios, favoritos y publicaciones locales. No recoge documentos de identidad ni envía mensajes reales.

### Supabase

1. Leer `docs/REVISION-SUPABASE.md`, que contiene la revisión del proyecto real y el estado de la conexión. Si la base cambió, obtener un diagnóstico actualizado con `supabase/diagnostic.sql`.
2. Generar el paquete con `node supabase/build-project-migration.mjs` y probar `supabase/project-migration.sql` en una copia aislada con el mismo esquema, enums, funciones y políticas. No ejecutar `project-reconciliation.sql` por separado.
3. Aplicar el paquete revisado mediante una migración autorizada. Reutiliza los buckets existentes y conserva registros y triggers. El paquete específico sustituye políticas únicamente si coincide el snapshot inspeccionado; no ejecutarlo a ciegas en producción.
4. Copiar `.env.example` a `.env.local` y establecer:

```dotenv
NEXT_PUBLIC_APP_MODE=live
NEXT_PUBLIC_SUPABASE_URL=https://jlolyhglduixwjjngcuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=clave-publica-del-proyecto
```

5. Configurar las URLs de Auth y probar cuentas normales y de administración antes de publicar. Reiniciar `npm run dev` al cambiar las variables. En Vercel, configurar las variables y volver a desplegar porque las variables públicas se incluyen en la compilación.

No utilizar `service_role` en el navegador. El modo live sin configuración muestra un error y un catálogo vacío; nunca sustituye un fallo del servicio por anuncios o cuentas ficticias. La sesión real procede de Supabase Auth y no del perfil demo guardado en el navegador.

## Funciones integradas en el código

| Función                                                                       | Tablas/servicio                                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Enlace de acceso por email, perfil y antigüedad                               | Supabase Auth, `profiles`                                          |
| Nombre/municipio públicos; teléfono/dirección privados                        | `profiles`, `profile_private`                                      |
| Catálogo con consultas y carga progresiva en servidor                         | `listings`, `profiles`, `listing_images`                           |
| Fotos optimizadas y posiciones 1–5                                            | Storage, `listing_images`                                          |
| Favoritos                                                                     | `favorites`                                                        |
| Solicitud de selfie y carnet, revisión humana                                 | Storage privado, `verification_requests`, `profiles`, `user_roles` |
| Publicación de propietarios individuales verificados y aprobación de anuncios | `listings`, `listing_moderation_history`                           |
| Reportar venta y retirar el anuncio de forma atómica                          | `listings`, `sales`                                                |
| Reseña de la plataforma después de reportar una venta                         | `platform_reviews`, `sales`                                        |
| Conversaciones, respuestas y lectura                                          | `conversations`, `messages`                                        |
| Reportes y bloqueo de contactos                                               | `reports`, `user_blocks`                                           |

La publicación, venta, reseña, verificación y mensajería usan funciones PostgreSQL (`imarket_*`) para que los cambios relacionados sean atómicos y los permisos se comprueben en la base. La interfaz no puede autoaprobar identidades, asignar roles ni incrementar reputación. La reputación se lee de los valores existentes en `profiles`; **reportar una venta externa no crea reputación nueva**.

El usuario administrador ve un panel para aprobar/rechazar identidades y anuncios. El primer rol de administración se asigna desde un contexto de confianza en la base, nunca mediante el formulario de registro. Los reportes se registran para moderación; el cierre de reportes/suspensión de cuentas todavía se realiza desde herramientas administrativas de Supabase.

Los mensajes se consultan al abrir y con el botón **Actualizar**; no se ha configurado Realtime ni notificaciones por email. Tu base ya contiene funciones para confirmación de ventas y reseñas entre usuarios, pero ese recorrido no está conectado a esta interfaz. La migración preparada retira su acceso desde el cliente mientras se incorpora un flujo validado. Las valoraciones de iMarket se guardan en `platform_feedback` y no modifican la reputación.

## Archivos SQL

- `schema-context.sql`: copia estructural de las tablas suministradas, con los placeholders `USER-DEFINED`. **No es ejecutable.** El antiguo esquema del prototipo se retiró para evitar confundirlo con la base existente.
- `diagnostic.sql`: consultas de solo lectura para obtener enums, políticas, RLS, grants, triggers, funciones y buckets. No extrae filas de usuarios.
- `integration.sql`: propuesta base con RPC, RLS y Storage, adaptada a los enums y restricciones observados. Se detiene ante políticas anteriores ajenas.
- `project-reconciliation.sql`: fragmento específico para reconciliar las políticas y triggers observados; no ejecutarlo por separado.
- `project-migration.sql`: migración completa para `jlolyhglduixwjjngcuk`. Se genera con `node supabase/build-project-migration.mjs` y compara un checksum del snapshot de políticas antes de sustituirlas. Probar en una copia aislada antes de aplicar.
- `docs/REVISION-SUPABASE.md`: hallazgos de la revisión real y límites de la conexión actual.

`imarket_contract()` devuelve los valores de enum y nombres de buckets usados por el cliente. Reconoce alias explícitos de estados y condiciones; si tu base usa otros valores, se debe adaptar la lista de candidatos después de conocer sus significados. No crea enums nuevos ni escribe estados inventados. La cola de revisión y el estado borrador deben ser estados distintos.

Se reutilizan los buckets observados: `listing-images` público y `verification-private` privado, ambos con máximo 5 MB y JPG/PNG/WebP. Los documentos solo se consultan por el propietario o un revisor autorizado; el panel usa enlaces temporales de 60 segundos. La integración no configura una eliminación automática de documentos: definir y aplicar la política de conservación antes de abrir el servicio.

Fotos: WebP a calidad 85 y lado máximo de 1600 px, antes de subir. Es compresión con pérdida de información, con buena calidad visual; no se promete identidad exacta de píxeles. Si una carga falla, se eliminan los archivos de esa carga que se pudieron subir. Si una respuesta de escritura se pierde después de confirmar, se comprueba si el registro existe antes de eliminar las fotos para no romperlo.

## Organización

- `app/`: ruta principal, metadata, icono y estilos.
- `components/`: catálogo, publicación, ventanas, perfil, mensajes y revisión.
- `hooks/use-remote-marketplace.js`: sesión y estado remoto, sin mezclarlo con la demo.
- `lib/database.mjs`: adaptador del esquema, consultas y llamadas RPC.
- `lib/catalog.mjs`: anuncios de ejemplo y filtros de la demo.
- `lib/images.js`: optimización de imágenes en memoria.
- `supabase/`: estructura de contexto, diagnóstico e integración propuesta.
- `tests/`: filtros, límites del adaptador y RLS/transacciones en PostgreSQL local mediante PGlite.
- `docs/LANZAMIENTO.md`: estado y pasos que faltan para abrir al público.

Las páginas HTML originales vacías se conservan como referencia. La aplicación activa es Next.js; no se inicia abriendo `index.html` con doble clic ni funciona en un hosting que sirva exclusivamente HTML.

## Despliegue

Importar el repositorio en Vercel con preset Next.js, raíz del proyecto y build `npm run build`. Establecer el modo live, las variables públicas del proyecto y la URL de redirección de Auth. La SQL no se ejecuta al desplegar: el código y los cambios de base deben coordinarse previamente. Revisar `docs/LANZAMIENTO.md` para los pasos pendientes.

## Validación y límites

Las pruebas de PostgreSQL usan la estructura suministrada, los enums y constraints observados en el proyecto real, y datos locales sintéticos. La migración específica se prueba también con reproducciones de los triggers de Auth, protección, fotos y reputación. El checksum de las políticas locales se sustituye solo en la prueba; no certifica la aplicación del snapshot remoto. Cubren aislamiento de direcciones y documentos, bloqueo de privilegios, propiedad de fotos, moderación, favoritos, participantes de conversaciones, bloqueo, ventas y reseñas. No prueban el correo real, la API real de Storage, todos los triggers existentes ni la aplicación de políticas en el proyecto remoto. La conexión MCP se comprobó mediante consultas de metadatos, pero no expone `apply_migration` y no se realizaron cambios remotos.

Los recorridos de navegador usan la demo y respuestas de API sintéticas para comprobar que el frontend llama los endpoints y campos correctos. Esto no sustituye la prueba final contra un proyecto Supabase propio.

## Recursos visuales

Las imágenes de ejemplo provienen del catálogo público de Apple (`store.storeimages.cdn-apple.com`), se optimizaron a WebP y no son fotos de vendedores. En modo live solo se muestran fotos de Storage o una imagen neutra cuando faltan. Manrope se sirve localmente (licencia OFL en `public/fonts/OFL.txt`), iconos Lucide y avatares decorativos de pravatar.cc.
