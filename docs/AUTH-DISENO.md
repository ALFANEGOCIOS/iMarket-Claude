# Autenticación y diseño

La aplicación usa ahora un flujo de autenticación por correo + contraseña:

- `/login`: `signInWithPassword()`
- `/registro`: `signUp()`
- `/dashboard`: protegido por `imarket_is_admin()`
- Usuarios normales vuelven a `/`
- Administradores entran en `/dashboard`

El sistema visual adopta el lenguaje de **shadcn/ui (estilo New York / Zinc)**: bordes suaves, superficies blancas, zinc/neutros, estados de foco, botones consistentes, tarjetas y controles reutilizables.

Los componentes base compatibles con el patrón de shadcn están en `components/ui/`.
