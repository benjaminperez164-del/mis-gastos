# Mis Gastos

App para anotar gastos personales y de proyectos, comparar proformas y guardar una copia de seguridad. Pensada para usarla en el teléfono, sin cuentas y sin servidor: todo queda en el dispositivo.

La moneda por defecto es el dólar (USD).

## Qué puedes hacer

- Registrar un gasto con monto, cualquier fecha (pasada o futura), descripción, nota y foto del comprobante.
- Clasificarlo como **personal** (con un tipo: Alimentación, Medicina, Transporte…) o de un **proyecto**.
- Definir tipos de gasto y marcarlos como recurrentes, con un monto estimado y un día del mes.
- Ver cada mes como una vista de los gastos de esas fechas. Al empezar un mes, la vista aparece sola. No hay que crear hojas.
- Los recurrentes entran como **por confirmar**. Solo los confirmados suman en los totales. Generarlos otra vez no los duplica.
- Crear proyectos con presupuesto opcional y estado activo o cerrado. Un proyecto acumula gastos de varios meses.
- Cargar proformas de un proyecto, compararlas lado a lado y aprobar una. Al aprobar puedes registrar el pago completo o un anticipo; el saldo pendiente queda visible y cada pago se convierte en un gasto del proyecto.
- Ver un aviso al llegar al 80% de un presupuesto y cuando se supera. El presupuesto de un tipo es mensual; el de un proyecto es el total del proyecto.
- Ver reportes por mes, por tipo y por proyecto, y exportar todo a CSV.
- Generar un respaldo JSON (cada semana y al cerrar el mes) y compartirlo para guardarlo en Drive. Restaurar ese archivo en otro teléfono recupera los datos, incluidas las fotos.

## Instalarla

### En el navegador, como app

Abre [https://benjaminperez164-del.github.io/mis-gastos/](https://benjaminperez164-del.github.io/mis-gastos/).

Para dejarla en la pantalla de inicio:

- **Android (Chrome):** menú ⋮ → **Agregar a pantalla principal** (o “Instalar app”).
- **iPhone (Safari):** botón Compartir → **Agregar a pantalla de inicio**.

La primera vez hay que publicar la web. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Cada push a `main` vuelve a publicarla.

### En Android, con el APK

En [Releases](https://github.com/benjaminperez164-del/mis-gastos/releases) descarga el archivo `mis-gastos-v….apk` de la versión que quieras.

En el teléfono, abre el archivo y acepta instalar desde esa fuente si Android lo pide. No hace falta tienda ni cuenta de Expo.

El APK se firma con la clave de depuración que trae Expo, la misma en cada compilación. Una versión nueva se instala encima de la anterior. No sirve para publicarla en Google Play.

## Respaldo en Drive y restaurar

1. En **Ajustes**, pulsa **Generar y compartir**. También aparece un aviso cada semana y cuando empieza un mes, porque la app ya preparó el archivo.
2. En el teléfono se abre la hoja para compartir. Elige **Guardar en Drive** (o Archivos, WhatsApp, etc.).
3. En el navegador, el mismo botón descarga el JSON.
4. En un teléfono nuevo, abre Mis Gastos → **Ajustes** → **Restaurar desde un archivo**, elige el JSON y confirma. Eso **reemplaza** lo que haya en ese dispositivo.

El archivo incluye las fotos de los comprobantes en base64. Si guardas muchas fotos, el respaldo pesa más y compartir o restaurar tarda un poco más.

Los datos no se suben solos a ningún servidor. Llegan a Drive solo si tú eliges guardarlos ahí.

## Desarrollar en local

Necesitas Node 22.

```bash
npm install
npm test
npm run typecheck
npm start
```

En la terminal de Expo pulsa `w` para abrir la web. La app usa la ruta `/mis-gastos`, igual que en GitHub Pages, así que la dirección local es:

`http://localhost:8081/mis-gastos`

Para generar el sitio estático:

```bash
npm run export:web
```

El resultado queda en `dist/`.

### Dónde se guardan los datos

En Android se usa SQLite (`expo-sqlite`). En la web se usa IndexedDB. SQLite dentro del navegador pide unas cabeceras (COOP/COEP) que GitHub Pages no puede enviar, así que la web no depende de eso. La app habla con las dos por la misma capa de datos.

### Cómo se publica

- [`.github/workflows/pages.yml`](.github/workflows/pages.yml) — en cada push a `main` exporta la web y la despliega con las acciones oficiales de GitHub Pages (`upload-pages-artifact` y `deploy-pages`). El origen de Pages tiene que ser **GitHub Actions**.
- [`.github/workflows/android-apk.yml`](.github/workflows/android-apk.yml) — cuando se sube una etiqueta `v*` (por ejemplo `v1.0.0`) hace `expo prebuild` y `gradlew assembleRelease`, sin cuenta de Expo ni de EAS, y adjunta el APK al Release.

## Licencia

MIT. Ver [LICENSE](LICENSE).
