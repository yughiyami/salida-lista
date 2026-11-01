# Aplicar la dirección visual generada al flujo del guía

Written against: checkout actual; commit no registrado en este plan. Cambios seleccionados explícitamente por el usuario.

## Evidence chain

- Surface: mobile/src/app/index.tsx, preparar.tsx y ruta.tsx, todos consumen mobile/src/ui/GuideScreen.tsx.
- Problem: captura real docs/evidence/android-2026-10-16/01-home-real.png carece de la fotografía del concepto; 04-ruta-real.png muestra un esquema elemental y el CTA queda fuera del primer viewport.
- Design evidence: docs/design/01-salidas-preparacion.png y 02-ruta-participantes.png, seleccionados por el usuario para acercar la implementación.
- Owner: GuideScreen.tsx, StyleSheet local s, Button y Card. Paleta gobernante #F7F5EF, #163F35, #C18A34.
- Scope: UI del guía; foto local y representación ilustrativa de ruta. No conectores, datos ni migraciones.
- Uncertainty: validar alturas pequeñas y escala de fuente; el esquema no puede presentarse como cartografía real.

## Design decision

Aplicar foto real acreditada de Salkantay, incluida como asset estático, en la tarjeta principal y cabecera de preparación; conservar demarcación de demo. Reemplazar la ruta por un esquema vectorial de contornos/montaña y tres hitos legibles, sin escala geográfica ni posición ficticia. El CTA «Registrar evento» estará en un área fija fuera de ScrollView, encima de navegación y dentro de SafeAreaView.

## Reuse

- Reutilizar colores y Button actual (mínimo 54 de alto); rutas Expo Router existentes.
- Reutilizar react-native-svg ya instalado; no añadir servicio de mapas ni dependencia de red.
- Un nuevo componente GuideVisuals.tsx expresa imagen y vector sin seguir engordando GuideScreen. Lo consumen home/prepare/route según corresponda.

## Changes

1. mobile/src/ui/GuideScreen.tsx: tarjeta principal con Image local y contenido marfil, revisión con cabecera fotográfica compacta; simplificar jerarquía para aproximar conceptos. Mantener todos los estados y acciones existentes.
2. mobile/src/ui/GuideVisuals.tsx: fotografía y esquema de contornos originales en SVG. Mapa claramente rotulado «Esquema ilustrativo · No usar para navegar»; sin escala, coordenadas del mapa ni marcador que implique ubicación de turistas.
3. Ruta: CTA fijo «Registrar evento» visible al entrar, tras scroll y en pantalla pequeña. Retirar CTA duplicado del contenido desplazable. No superponerlo al contenido con posición absoluta; usar distribución flex y SafeArea.
4. Conexiones: crédito local legible de la fotografía, autor, licencia y enlace fuente; los textos de atribución también disponibles offline. Fuente propuesta McKay Savage, Wikimedia Commons, CC BY 2.0. Root confirmará asset exacto.

## Scope

- Inherit: home, preparación y ruta. Resto solo cambios compartidos de cabecera/espaciado si necesarios.
- Verify: eventos, participantes, compartir y teclado siguen operativos.
- Exclude: BD, hooks, eventos, outbox, API, permisos extra, migraciones, mapas navegables y posición remota.

## Validation

- Product: instalar actualización -r sin borrar datos; mantener los 2 eventos y participantes existentes; crear un tercer evento offline y reabrir.
- Interface: capturas reales en emulador normal y viewport reducido; el CTA está íntegramente dentro de la pantalla al entrar y después de desplazar. Foto visible sin red.
- System: Image require estático, vector local, ninguna URL remota usada para renderizar pantalla.
- Repository: npm run lint; npm run typecheck; npm test. Build release nativa x86_64 con toolchain ya corregida.

## Stop conditions

- No usar una foto sin fuente/licencia verificada. Si falla la obtención, informar; no sustituirla por screenshot de otro mockup.
- No afirmar cartografía descargada ni seguridad/cobertura a partir de estética.
- No resetear datos para validar rediseño.

## Design documentation

- Registrar fuente/licencia y resultados offline en docs y conservar capturas en directorio nuevo sin sobrescribir la evidencia anterior.
