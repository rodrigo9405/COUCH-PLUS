# COUCH+

Sistema para entrenadores personales con tres vistas: **superadministrador**, **entrenador** y **alumno**.

**Página:** https://rodrigo9405.github.io/COUCH-PLUS/

## Qué hace

**Superadministrador**
- Ve y administra a todos los entrenadores y alumnos (crear, editar, eliminar, reasignar).
- Activa o desactiva entrenadores. Un entrenador desactivado y todos sus alumnos quedan sin acceso.
- Lleva la suscripción de cada entrenador (mensual, trimestral o anual) con recordatorio 5 días antes.
- Entra con usuario, contraseña **y un código de 4 dígitos**.

**Entrenador**
- Solo ve a sus propios alumnos y crea sus cuentas.
- Revisiones con fotos y medidas (plantillas o libres) y fecha de la próxima revisión.
- Dieta semanal con esquemas predeterminados, platos guardados y recetas opcionales.
- Rutinas de 1 a 7 días con series, repeticiones, descanso e instrucciones.
- Progreso por día, mes o año, con las omisiones del alumno resaltadas en rojo.

**Alumno**
- Inicio con la dieta del día, lo que le toca entrenar y su avance.
- Entrenamiento guiado con figura 3D animada, registro de series y temporizador de descanso.
- Carrito de compras calculado desde la dieta (día, semana o mes).

## Cómo está hecho

- **Frontend:** una sola página estática (`index.html`) con Preact + htm y Three.js. Se publica con GitHub Pages.
- **Backend:** Supabase (proyecto `COUCH-PLUS`, región São Paulo).
  - Inicio de sesión con Supabase Auth. Cada usuario se guarda con un correo interno derivado de su nombre de usuario; nadie necesita correo real.
  - Todos los datos están en la tabla `docs`, protegida con **Row Level Security**: cada rol solo puede leer y escribir lo suyo, y el superadministrador no tiene permisos hasta ingresar su código.
  - Las cuentas se crean y gestionan con funciones SQL que validan el rol de quien llama.
  - Los cambios se ven en tiempo real en todos los dispositivos.
- La clave que aparece en el código (`sb_publishable_…`) es pública por diseño; la seguridad la dan las políticas de la base de datos.

## Estructura

```
index.html              Página publicada (generada)
build.py                Genera index.html a partir de src/
src/
  fig3d.js              Figura 3D y animaciones de ejercicios
  core.js               Fechas, cálculos de progreso, compras y recordatorios
  store-supabase.js     Conexión con Supabase: datos, tiempo real y cuentas
  ui.js, shared.js      Componentes y formularios
  admin.js, trainer.js, student.js, views.js   Vistas por rol
  main.js               Acceso, navegación y arranque
  styles.css            Estilos (tema claro y oscuro)
supabase/schema.sql     Tablas, permisos y funciones de la base de datos
```

## Hacer cambios

1. Edita los archivos de `src/`.
2. Ejecuta `python3 build.py` para regenerar `index.html`.
3. Sube los cambios a `main`; GitHub Pages publica en uno o dos minutos.

## Seguridad recomendada en el panel de Supabase

- **Authentication → Sign In / Providers → Email:** desactiva *Allow new users to sign up*. Las cuentas solo se crean desde la app.
- **Authentication → Password security:** activa la protección contra contraseñas filtradas.
