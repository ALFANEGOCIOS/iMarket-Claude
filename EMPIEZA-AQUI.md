# iMarket — proyecto con integración preparada para Supabase

## Probar la interfaz

1. Instala Node.js 24 y npm 11 o superior.
2. Abre una terminal en esta carpeta y ejecuta `npm ci`.
3. Copia `.env.example` a `.env.local` manteniendo `NEXT_PUBLIC_APP_MODE=demo`.
4. Ejecuta `npm run dev` y abre http://localhost:3000.

En modo demo se usan datos de ejemplo y almacenamiento local del navegador.

## Conectar tu base de datos

La aplicación está adaptada a las tablas que compartiste. Se ha confirmado acceso de lectura a la estructura del proyecto real mediante MCP;
no se han aplicado cambios remotos ni validado el recorrido del proveedor.

1. Ejecuta `supabase/diagnostic.sql` en el editor SQL de Supabase. Es de solo lectura.
2. Revisa los enums, políticas, permisos, funciones, triggers y buckets obtenidos.
3. Lee `docs/REVISION-SUPABASE.md` y prueba `supabase/project-migration.sql`
   en una copia aislada. Se genera con `node supabase/build-project-migration.mjs`.
   El paquete compara el snapshot de políticas y conserva tablas, registros,
   documentos y triggers. Añade platform_feedback, reutiliza tus buckets y
   retira las RPC anteriores del cliente. No ejecutes project-reconciliation.sql
   por separado. La herramienta apply_migration aún no está habilitada aquí.
4. Configura URL y clave pública en `.env.local`, cambia el modo a `live`, configura
   Auth y asigna un administrador desde un contexto autorizado de la base.
5. Completa las pruebas y pendientes de `docs/LANZAMIENTO.md` antes de admitir
   documentos y anuncios reales. Nunca publiques una clave service_role.

`supabase/schema-context.sql` conserva la estructura que compartiste para contexto;
no es una migración ejecutable. Todavía contiene marcadores USER-DEFINED.

Consulta README.md para detalles y comandos. Para Vercel, importa esta carpeta
como proyecto Next.js; las modificaciones SQL no se ejecutan al desplegar.

## Validación realizada

Pasaron lint y 29 pruebas. El build de producción anterior sigue vigente: el
frontend, sus dependencias y configuración de ejecución no cambiaron. Se probaron ambos modos en un
navegador sin interfaz: demo y API con respuestas sintéticas. Las pruebas SQL usan
PostgreSQL local con enums y restricciones observados, datos sintéticos y
reproducciones de los triggers. No validan correo/Storage reales ni la aplicación
de la migración a las políticas y triggers del proyecto remoto. CodeRabbit no pudo revisar porque
la revisión está deshabilitada en esta tarea.
