# Revisión de la base real de iMarket

Fecha: 30 de septiembre de 2026. Proyecto: `jlolyhglduixwjjngcuk`.

## Acceso y estado

La conexión MCP responde y permite consultar la estructura del proyecto. Se revisaron tablas, enums, RLS, políticas, permisos por tabla/columna, funciones, triggers, constraints, índices, buckets, migraciones y avisos de seguridad. No se recuperaron filas personales, correos, direcciones, imágenes ni valores secretos de `private.internal_config`. Se comprobó únicamente mediante un booleano que el mecanismo interno está configurado. No se ejecutaron escrituras remotas.

Las 14 tablas públicas tienen RLS activado. Los enums reales incluyen `active`, `pending_review`, `sold`, `approved`, `rejected`, `original`, `generic`, `admin` y `moderator`. Existe un trigger de Auth que crea los perfiles público y privado. Los buckets existentes son:

| Bucket                 | Visibilidad | Límite | Formatos        |
| ---------------------- | ----------- | ------ | --------------- |
| `listing-images`       | Público     | 5 MB   | JPEG, PNG, WebP |
| `verification-private` | Privado     | 5 MB   | JPEG, PNG, WebP |

No existe `imarket_contract()` ni las demás RPC de la aplicación entregada. No hay roles asignados en `user_roles`. La lista registrada de migraciones está vacía; esto no significa que la base esté vacía ni que no haya recibido cambios mediante el editor SQL.

## Hallazgos que afectan a la integración

1. **Reseñas:** `platform_reviews` representa reseñas de una persona a otra. Tiene constraints `reviewer_id <> user_id` y un trigger que actualiza reputación. La versión anterior del proyecto intentaba guardar al autor en ambos campos para valorar la plataforma. Esa operación fallaría. Se preparó `platform_feedback` para la valoración de iMarket, conservando las reseñas y métricas existentes.
2. **Publicación:** las políticas `listings_owner_insert` y `listings_insert_own` se superponen. La segunda exige únicamente que el vendedor sea el usuario actual; el rol `authenticated` tiene INSERT. El trigger de campos protegidos actúa antes de UPDATE, no de INSERT. Por inspección, la política restrictiva de borradores no garantiza por sí sola verificación ni revisión previa. No se intentó publicar un anuncio malicioso en la base real.
3. **Mensajes y conversaciones:** el rol `authenticated` puede actualizar participantes de conversaciones y columnas `content` y `sender_id` de mensajes. Las políticas existentes permiten actualizar filas a los participantes y no hay un trigger de inmutabilidad para esos campos. Se preparó revocar esas escrituras y canalizar las operaciones mediante RPC con participantes y remitente derivados de la sesión.
4. **Fotos:** el trigger existente exige `vendedor/anuncio/posición.webp`; el cliente genera nombres UUID. Se preparó ampliar el validador para aceptar ambos formatos, conservando la propiedad de la ruta y la comprobación de objetos en Storage desde la RPC.
5. **Cambios de estado:** los triggers existentes requieren el mecanismo interno para modificar campos protegidos. Se adaptaron las RPC de venta y reenvío de verificación para usar ese mecanismo dentro de su transacción y limpiar su contexto al terminar.
6. **Funciones anteriores:** `_begin_internal_op()` tiene EXECUTE para `anon` y `authenticated`. La migración preparada revoca el acceso directo a este helper y a las RPC anteriores del cliente. Los triggers y funciones se conservan para las operaciones internas. Los clientes antiguos deben migrar a las RPC `imarket_*`.
7. **Políticas:** existen reglas superpuestas que harían abortar correctamente `integration.sql`. La migración específica compara un checksum de la configuración completa observada antes de reemplazar las políticas. Si cambiaron, se detiene y requiere una nueva revisión. La sustitución, las funciones y los grants forman una sola transacción.

## Archivos preparados

- `supabase/integration.sql`: contrato, RPC, RLS, permisos y configuración de los buckets existentes; añade `platform_feedback`.
- `supabase/project-reconciliation.sql`: fragmento de reconciliación específico del proyecto. **No ejecutarlo solo.**
- `supabase/build-project-migration.mjs`: genera el paquete transaccional sin conectarse a la base.
- `supabase/project-migration.sql`: paquete completo que se debe revisar/probar y aplicar mediante una migración autorizada.

La migración conserva tablas, filas, Auth y triggers de reputación. Añade una tabla, redefine el validador de rutas, fija search_path de funciones antiguas, retira accesos de cliente a RPC anteriores y reemplaza la configuración de políticas inspeccionada. No borra registros, buckets, archivos ni el secreto interno. Debe probarse en una copia aislada antes de aplicarla al proyecto real.

## Avisos del asesor de Supabase

- Diez funciones tienen `search_path` mutable. Se preparó su ajuste: [remediación](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).
- Hay funciones SECURITY DEFINER ejecutables desde roles de cliente. No todos esos avisos representan un defecto: varias RPC necesitan ejecución autenticada y deben validar permisos internamente. El helper interno sí se retira de la API de cliente: [ejecución anónima](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).
- `pg_trgm` está en `public`. No se propone moverlo sin revisar dependencias: [remediación](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public).
- La protección de contraseñas filtradas está desactivada. El flujo actual utiliza enlaces por correo; revisar esta opción si se habilitan contraseñas: [guía](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- `private.internal_config` tiene RLS sin políticas. Es una configuración interna; no se añade una política de lectura para los clientes: [explicación del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Qué sigue bloqueado

La conexión actual no expone `apply_migration`. Las instrucciones de la herramienta SQL exigen usar migraciones para DDL; no se utiliza `execute_sql` para saltar esa limitación. Habilitar `apply_migration` en la conexión, con permisos de escritura y sin modo de solo lectura, si se quiere aplicar desde esta tarea.

Todavía no se ha aplicado la migración, iniciado sesión mediante el correo real, probado cargas/signed URLs de Storage, ni ejecutado el recorrido completo con dos usuarios y un administrador en Supabase. Las pruebas locales usan enums/constraints observados y reproducciones acotadas de los triggers; los datos y la política de prueba son sintéticos. No equivalen a una validación remota.

Después de aplicar, repetir los asesores y comprobar permisos con cuentas de prueba, crear explícitamente el administrador elegido, configurar URL/clave pública/redirects de Auth y activar `live`. Completar conservación de documentos, condiciones, soporte, límites, copias de seguridad y despliegue según `LANZAMIENTO.md`.
