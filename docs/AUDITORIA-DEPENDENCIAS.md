# Auditoría de Dependencias (`npm audit`)

Fecha de ejecución: 2026-11-01
Comando: `npm audit` (en `mobile/`, tras `npx expo install --fix` e instalación de `expo-dev-client`, sin usar `npm audit fix --force`).

## Resumen por severidad

| Severidad | Cantidad |
| :--- | ---: |
| Crítica (`critical`) | 0 |
| Alta (`high`) | 1 |
| Moderada (`moderate`) | 26 |
| Baja (`low`) | 0 |
| Informativa (`info`) | 0 |
| **Total** | **27** |

Dependencias auditadas: 840 en total (537 `prod`, 263 `dev`, 50 `optional`, 18 `peer`).

## Detalle por paquete y severidad

### Severidad Alta (1 paquete)

| Paquete | Directa | Rango afectado | Causa / Advisory |
| :--- | :--- | :--- | :--- |
| `zod` | No (transitiva de CLI/tooling) | `<4.6.6` | *Zod can exhaust memory while validating oversized constrained collections* (`GHSA-mrhx-c7xc-m3w5`) |

### Severidad Moderada (26 paquetes)

Las 26 alertas moderadas provienen de dos avisos transitivos en herramientas de construcción/linting (`minimatch` `GHSA-g3hv-75wg-m249` y `glob` `GHSA-3g3m-2fjr-6pw4`) y su cadena de dependientes en `@expo/*`, `eslint` y `@typescript-eslint/*`:

| Paquete | Directa | Rango afectado | Vía / Origen |
| :--- | :--- | :--- | :--- |
| `minimatch` | No | `<11.0.1` | `GHSA-g3hv-75wg-m249` (DoS potencial por amplificación de `globparts`) |
| `glob` | No | `3.0.0 - 14.0.1` | `GHSA-3g3m-2fjr-6pw4` (`AbortSignal` bypass) y `minimatch` |
| `@eslint-community/eslint-utils` | No | `*` | `eslint` |
| `@eslint/config-array` | No | `*` | `minimatch` |
| `@eslint/eslintrc` | No | `0.0.1 \|\| >=0.1.1` | `minimatch` |
| `@expo/cli` | No | `>=0.19.0-canary-20240625-2333e70` | `@expo/config`, `@expo/config-plugins`, `@expo/inline-modules`, `@expo/metro-config`, `@expo/prebuild-config`, `glob` |
| `@expo/config` | No | `>=9.1.0-canary-20240628-1ba8152` | `@expo/config-plugins`, `glob` |
| `@expo/config-plugins` | No | `>=8.1.0-canary-20240904-69100c1` | `glob` |
| `@expo/fingerprint` | No | `*` | `glob`, `minimatch` |
| `@expo/inline-modules` | No | `>=0.0.2-canary-20260409-6fc2991` | `@expo/config-plugins` |
| `@expo/local-build-cache-provider` | No | `*` | `@expo/config` |
| `@expo/metro-config` | No | `>=0.19.0-canary-20240625-2333e70` | `@expo/config`, `glob` |
| `@expo/prebuild-config` | No | `>=7.1.0-canary-20240904-69100c1` | `@expo/config`, `@expo/config-plugins` |
| `@maplibre/maplibre-react-native` | Sí | `>=11.3.3` | `expo` |
| `@typescript-eslint/eslint-plugin` | No | `*` | `@typescript-eslint/parser`, `@typescript-eslint/type-utils`, `@typescript-eslint/utils`, `eslint` |
| `@typescript-eslint/parser` | No | `*` | `@typescript-eslint/typescript-estree`, `eslint` |
| `@typescript-eslint/type-utils` | No | `>=5.9.2-alpha.0` | `@typescript-eslint/typescript-estree`, `@typescript-eslint/utils`, `eslint` |
| `@typescript-eslint/typescript-estree` | No | `>=6.16.0` | `minimatch` |
| `@typescript-eslint/utils` | No | `*` | `@eslint-community/eslint-utils`, `@typescript-eslint/typescript-estree`, `eslint` |
| `eslint` | Sí | `0.7.1 - 2.0.0-rc.1 \|\| >=4.1.0` | `@eslint-community/eslint-utils`, `@eslint/config-array`, `@eslint/eslintrc`, `minimatch` |
| `eslint-config-expo` | Sí | `*` | `@typescript-eslint/*`, `eslint`, `eslint-plugin-*` |
| `eslint-plugin-expo` | No | `>=0.0.1-canary-20240327-a7302d9` | `@typescript-eslint/utils`, `eslint` |
| `eslint-plugin-import` | No | `>=1.15.0` | `minimatch` |
| `eslint-plugin-react` | No | `>=7.23.0` | `minimatch` |
| `expo` | Sí | `>=52.0.0-canary-20240625-2333e70` | `@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/fingerprint`, `@expo/local-build-cache-provider`, `@expo/metro-config` |
| `expo-splash-screen` | Sí | `>=56.0.0-canary-20260212-4f61309` | `@expo/config-plugins` |

## Nota operativa

No se ejecutó `npm audit fix --force` porque propone degradar paquetes centrales de Expo SDK 58 y `eslint-config-expo` a versiones incompatibles con el proyecto. La revisión y mitigación mediante `overrides` compatibles se abordará en la Fase 7 (Endurecimiento y publicación).

