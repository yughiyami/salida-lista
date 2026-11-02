# Salida Lista

App móvil (React Native + Expo) para mantener a un grupo conectado y a salvo, con dos modos:

- **Círculos** (estilo Life360): cuentas, círculos privados con código de invitación, mapa en vivo con la ubicación y la batería de cada miembro, lugares con avisos de llegada y salida, "Llegué bien", SOS y chat.
- **Modo guía** (sin cuenta y sin internet): salidas de campo con cartografía OpenStreetMap local de Perú y Arequipa, presencia, checklist y registro de eventos que sobreviven al cierre de la app.

> **Estado: prototipo.** No es un servicio de emergencias: el SOS avisa solo a tu círculo, no a policía, bomberos ni ambulancias. Ver [qué está verificado](#estado-de-verificación).

## Estructura del repositorio

```text
.
├── mobile/        App Expo (código, pruebas, configuración nativa)
│   ├── src/app/       Pantallas (Expo Router): (auth), (tabs), circulo, chat, lugar, guia
│   ├── src/features/  Lógica por dominio: auth, circles, location, places, push
│   ├── src/domain/    Reglas puras (geo, mapas offline, eventos)
│   ├── src/ui/        Sistema de diseño: tema, componentes, mapa en vivo
│   └── tests/         Pruebas automáticas (node:test)
├── supabase/      Migraciones SQL (esquema, RLS y funciones del backend)
├── docs/
│   ├── guias/         Documentación vigente (backend, privacidad, Play Store, diseño…)
│   └── historial/     Pruebas, evidencias y registros de versiones anteriores
└── README.md
```

## Inicio rápido

Requisitos: Node 24, `pnpm`, JDK 21 y Android SDK para compilar localmente.

```bash
cd mobile
cp .env.example .env        # completa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_KEY
pnpm install
pnpm run typecheck && pnpm run lint && pnpm test
pnpm exec expo run:android  # development build; MapLibre no funciona en Expo Go
```

Backend (una sola vez, con tu proyecto de Supabase): sigue [docs/guias/SUPABASE-SETUP.md](docs/guias/SUPABASE-SETUP.md). El acceso es con correo y contraseña, sin servidor SMTP: hay que apagar *Confirm email* en Supabase.

APK de prueba (ARM64, firma de depuración): en [Releases](../../releases).

> En Windows, compila desde una ruta corta (por ejemplo `D:\sl`): las carpetas de pnpm más una ruta larga superan los 260 caracteres y CMake falla.

## Documentación

| Documento | Para qué |
|---|---|
| [guias/SUPABASE-SETUP.md](docs/guias/SUPABASE-SETUP.md) | Conectar el backend y aplicar las migraciones |
| [guias/DISENO.md](docs/guias/DISENO.md) | Sistema de diseño "Señal de ruta" y pantallas |
| [guias/PRIVACIDAD.md](docs/guias/PRIVACIDAD.md) | Qué datos se guardan, por cuánto tiempo y controles |
| [guias/PLAY-STORE-UBICACION.md](docs/guias/PLAY-STORE-UBICACION.md) | Respuestas para los formularios de ubicación en segundo plano |
| [guias/PUSH-FCM.md](docs/guias/PUSH-FCM.md) | Notificaciones push con Firebase |
| [guias/SALIDA-LISTA-MVP.md](docs/guias/SALIDA-LISTA-MVP.md) | Alcance original del modo guía |
| [guias/CONEXIONES-Y-CREDENCIALES.md](docs/guias/CONEXIONES-Y-CREDENCIALES.md) | Cuentas e integraciones futuras (Bókun, WhatsApp) |
| [historial/](docs/historial) | Pruebas físicas, capturas y registros de las versiones 1.0.x |
| [mobile/ROADMAP.md](mobile/ROADMAP.md) | Prioridades y deuda pendiente |

## Estado de verificación

**Verificado**
- TypeScript, lint y 46 pruebas automáticas (reglas de geografía, validaciones, cola de ubicación, contraseñas).
- Migraciones aplicadas en un Supabase real y comprobadas con una prueba de permisos entre tres usuarios: un miembro ve a su círculo, un ajeno no ve nada; pausa, dejar de compartir, SOS, suplantación bloqueada y borrado de cuenta.
- La APK compila, instala y abre en un Redmi (Android 14, ARM64) con sesión, mapa en vivo y círculos.

**Sin verificar**
- Uso entre dos teléfonos, ubicación en segundo plano, avisos de lugares, SOS y chat entre personas.
- Notificaciones push con la app cerrada (necesitan Firebase y un proyecto de EAS).
- iOS nunca se compiló. La retención automática depende de `pg_cron`.

**Deuda conocida:** 28 alertas de `npm audit`, `GuideScreen.tsx` de unas 1.270 líneas y `eas.json` sin proyecto de EAS asociado.

## Versiones

| Versión | Contenido |
|---|---|
| 1.2.0 | Rediseño completo de la interfaz |
| 1.1.x | Cuentas con contraseña, círculos, mapa en vivo, lugares, SOS, chat, ubicación en segundo plano, privacidad |
| 1.0.x | Modo guía offline con mapas de Perú y Arequipa ([historial](docs/historial/README-1.0-a-1.1.md)) |

Licencia: ver [mobile/LICENSE](mobile/LICENSE). Datos cartográficos © OpenStreetMap contributors (ODbL) y Natural Earth; ver [mobile/THIRD_PARTY_NOTICES.md](mobile/THIRD_PARTY_NOTICES.md).
