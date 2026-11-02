# Sistema de diseño — "Señal de ruta"

Interfaz de operación (se consulta rápido, con una mano, a la luz del día). La identidad parte de los mapas de ruta impresos: líneas de contorno topográfico, verde abeto y la marca de sendero en lima.

## Tokens (`mobile/src/ui/theme.ts`)

| Rol | Valor | Uso |
|---|---|---|
| Fondo (`ground`) | `#F2F4EF` | Fondo de pantallas, piedra fría |
| Superficie | `#FFFFFF` | Tarjetas, hoja inferior del mapa |
| Abeto (`spruce`) | `#0D5B45` | Acción primaria |
| Abeto profundo | `#08382B` | Héroe de acceso, código de invitación, chips activos |
| Lima (`lime`) | `#C8F169` | Marca de sendero: pestaña activa, acento sobre verde oscuro |
| En vivo | `#1FA971` | Anillo de avatar con ubicación reciente |
| Peligro | `#C8281E` | SOS y acciones destructivas |
| Tinta | `#10231D` / `#4F6158` | Texto principal / secundario (≥ 4,5:1 sobre el fondo) |

Tipografía: **Figtree** (400, 500, 600, 700, 800), empaquetada en la app; escala en `type` (display 32, título 24, encabezado 17, cuerpo 15, pequeño 13, nota 12). Radios 10–28 px. Dos sombras: `card` y `float`.

## Firma visual

- **Contornos topográficos** (`ui/Topo.tsx`): curvas de nivel generadas en SVG, en la cabecera de cada pestaña (verde tenue sobre piedra) y en los héroes oscuros (lima tenue).
- **Avatar con anillo de estado**: verde = en vivo, gris = posición antigua, rojo = SOS. Mismo lenguaje en el mapa, la hoja inferior y las listas.
- **Marcadores del mapa**: avatar con anillo, cola y etiqueta con el nombre; el lugar se dibuja como zona verde con etiqueta oscura.

## Pantallas

| Pantalla | Idea |
|---|---|
| Acceso / Perfil | Héroe abeto con contornos lima + hoja clara; selector "Entrar / Crear cuenta" |
| Mapa | Mapa a pantalla completa, chips de círculo flotantes, hoja inferior con personas y las acciones "Llegué bien" y SOS |
| Círculos | Tarjetas con pila de avatares y código; crear o unirse en un solo selector |
| Círculo | Tarjeta oscura con el código en grande, interruptor de ubicación, miembros con estado |
| Chat | Burbujas propias en abeto; llegadas, "Llegué bien" y SOS como avisos con icono |
| Lugares / Nuevo lugar | Tarjetas con icono y radio; mapa para colocar la zona |
| Ajustes | Cuenta, ubicación, notificaciones, privacidad y modo guía en tarjetas con icono |

Los iconos son de Lucide, con trazo uniforme. El modo guía sin conexión (`GuideScreen`) conserva su diseño anterior.

## Alcance honesto

- Se aplicó el rediseño completo a las pantallas de cuentas, círculos, mapa, lugares, chat y ajustes. **No** se rediseñó el modo guía.
- No se hizo la revisión de contraste ni de accesibilidad con herramientas; solo se eligieron colores con contraste alto.
- Se instaló y abrió en un Redmi (Android 14, ARM64) y se comprobaron visualmente el mapa, la barra de pestañas, Ajustes y Lugares. No hay pruebas en pantallas pequeñas ni en tabletas, y no se incluyen capturas en el repositorio.
