# Qué falta para publicar iMarket

## Estado actual

El código y la propuesta SQL se revisaron contra el proyecto real `jlolyhglduixwjjngcuk`. Se confirmó acceso de lectura a su estructura y se detectaron restricciones y triggers adicionales. **No se ha aplicado ningún cambio remoto.** La conexión actual no expone la herramienta `apply_migration`.

Consulta `REVISION-SUPABASE.md` para los hallazgos, medidas preparadas y avisos de seguridad.

## 1. Aplicar la integración revisada

- Los enums reales se conocen y son compatibles. Las políticas actuales se superponen; los buckets existentes son `listing-images` y `verification-private` (ambos 5 MB).
- `platform_reviews` representa reseñas entre usuarios y actualiza reputación. La propuesta añade `platform_feedback` para valorar la plataforma sin cambiar métricas personales.
- Las ventas externas reportadas no aumentan reputación. La confirmación del comprador y las reseñas entre usuarios aún requieren un recorrido de interfaz y comprobaciones de permisos.
- La propuesta mantiene publicación entre propietarios de cuentas individuales; no habilita cuentas `business`.
- Generar `supabase/project-migration.sql` con `node supabase/build-project-migration.mjs`. Revisar/probar el paquete completo en una copia aislada. No ejecutar `project-reconciliation.sql` por separado.
- La migración comprueba el snapshot de políticas inspeccionado antes de sustituirlas. Si cambiaron, obtener un diagnóstico nuevo. No reemplaza ni borra tablas, datos o archivos existentes; sí retira de los clientes las RPC anteriores y habilita las RPC `imarket_*`.
- Habilitar `apply_migration` con escritura en la conexión MCP para aplicarla desde esta tarea; de lo contrario, la aplicación remota queda pendiente.

## 2. Conectar y verificar Supabase

- Aplicar primero la migración completa revisada a una copia de pruebas y verificar que sus triggers/constraints adicionales también se reproducen.
- Configurar URL del proyecto y clave pública en `.env.local` y Vercel. No incluir claves privadas en el código ni en archivos públicos.
- Configurar Auth con el dominio definitivo y las URLs de redirección.
- Configurar el envío de correo para usuarios reales y comprobar entrega, spam y vencimiento del enlace. Activar los controles de abuso de Auth apropiados.
- Crear o reconocer un perfil de administrador y asignar su rol desde la base con un contexto autorizado. No hay autoasignación del primer administrador.

## 3. Probar el recorrido completo contra el proyecto real

Usar al menos un visitante, dos usuarios normales y un administrador, con datos sintéticos:

- Acceso por email y creación del perfil; recuperación de la sesión y salida.
- Subir selfie/carnet; intentar leer las imágenes desde la otra cuenta y como visitante. Revisar rechazo y aprobación.
- Publicar 1–5 fotos; impedir una sexta y fotos ajenas; revisar el anuncio antes de hacerlo público.
- Ver un catálogo público, filtrar, cargar más resultados y guardar favoritos en otra sesión/dispositivo.
- Enviar/responder mensajes, marcar lectura y bloquear; comprobar que terceros no pueden leer ni suplantar mensajes.
- Marcar vendido, confirmar que desaparece del catálogo y que solo se registra una venta; guardar una reseña sin duplicados.
- Intentar cambiar verificación, roles, suspensión, vendedor y reputación desde el navegador; todo debe ser rechazado por la base.
- Probar interrupciones de conexión y limpieza de fotos huérfanas. No confundir un fallo de escritura con una confirmación de éxito.

## 4. Completar las operaciones del lanzamiento

- Definir quién revisa identidades, anuncios y reportes, y cómo responde a rechazos, fraude y solicitudes de soporte. La interfaz actual revisa identidades/anuncios; el cierre de reportes y las suspensiones requieren herramientas de administración.
- Definir y aplicar conservación/eliminación de selfies y carnets. Tus claves foráneas no incluyen `ON DELETE CASCADE`; preparar una eliminación ordenada de dependencias y archivos para poder atender solicitudes de eliminación de cuenta. Los enlaces temporales no eliminan el archivo ni revocan enlaces ya emitidos antes de su caducidad.
- Finalizar las condiciones y el aviso de privacidad con las decisiones reales del servicio: datos recogidos, finalidad, quién accede, plazo de conservación y cómo solicitar eliminación. Retirar el texto que describe el modo de prueba en la versión pública.
- Establecer límites de publicación, carga y mensajería para evitar spam y controlar consumo; comprobar los límites de Auth. La propuesta valida permisos y tamaños, pero todavía no implementa cuotas por usuario ni rate limiting propio de RPC.
- Configurar seguimiento de errores, copias de seguridad/restauración, limpieza de archivos huérfanos y alertas de consumo. Revisar cuáles están disponibles en el plan contratado.
- Desplegar en Vercel, configurar dominio y HTTPS, actualizar Auth y ejecutar el recorrido anterior desde el dominio final. Probar también desde conexiones reales de La Habana, incluyendo móvil y redes lentas.

## Mejoras que pueden venir después

- Confirmación de la venta por el comprador y reseñas de vendedores vinculadas a transacciones. La reputación existente se muestra, pero el nuevo flujo no genera reputación por ventas externas sin confirmar.
- Realtime y notificaciones: por ahora el buzón tiene actualización manual.
- Edición/reenvío de anuncios rechazados, motivos de moderación visibles al vendedor y gestión de reportes dentro del panel.
- URLs individuales de anuncios para compartir y mejorar su aparición en buscadores.
- Conteos completos por modelo, catálogo configurable para añadir nuevos modelos y opciones de guardar filtros.

## Qué falta en la conexión de esta tarea

La URL del proyecto ya se confirmó. Habilitar la herramienta `apply_migration` y el acceso de escritura para aplicar el paquete revisado desde la tarea. Después se puede obtener la clave pública mediante la conexión y configurar el cliente. No hacen falta contraseñas de PostgreSQL ni claves `service_role` en el chat. Elegir explícitamente la cuenta que administrará las verificaciones; no se asigna automáticamente ese privilegio al primer usuario.
