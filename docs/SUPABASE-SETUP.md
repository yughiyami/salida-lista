# Conectar Supabase (una sola vez)

Estos pasos necesitan tu cuenta de Supabase; no se pueden hacer sin iniciar sesión.

## 1. Vincular y aplicar migraciones

```bash
cd D:\proyectos\react_test
npx supabase login
npx supabase link --project-ref <ref-de-tu-proyecto>
npx supabase db push
```

`<ref-de-tu-proyecto>` es el texto entre `https://` y `.supabase.co` en `EXPO_PUBLIC_SUPABASE_URL`.

`db push` aplica, en orden:

| Migración | Contenido |
|---|---|
| `20261101000000_profiles.sql` | Perfiles (fase 1) |
| `20261101010000_circles.sql` | Círculos, miembros, códigos de invitación, RLS |
| `20261101020000_locations.sql` | Ubicación en vivo, consentimiento, pausa, `push_locations` |
| `20261101030000_places_messages.sql` | Lugares, chat/avisos/SOS, tokens push, trigger de notificaciones, Realtime |
| `20261101040000_privacy.sql` | Exportar datos, borrar cuenta, retención |

## 2. Código de 6 dígitos en el correo

Dashboard → Authentication → Email Templates → **Magic Link**. Reemplaza el enlace por el código:

```html
<h2>Tu código de acceso</h2>
<p>Ingresa este código en Salida Lista:</p>
<p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
```

## 3. Retención automática (opcional pero recomendado)

Dashboard → Database → Extensions → habilita **pg_cron**. Después vuelve a ejecutar la última
sentencia de `20261101040000_privacy.sql` (el bloque `do $$ ... cron.schedule`) desde el SQL Editor.
Sin pg_cron, ejecuta `select private.purge_expired_data();` a mano de vez en cuando.

## 4. Comprobación rápida

En el SQL Editor, con dos usuarios de prueba:

1. `select * from public.create_circle('Prueba');` → devuelve el círculo y un `invite_code` de 8 caracteres.
2. Como el otro usuario: `select * from public.join_circle('<codigo>');`.
3. Un tercer usuario que **no** esté en el círculo no debe ver filas en `user_locations`, `messages` ni `places`.
