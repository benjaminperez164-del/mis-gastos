import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const htmlPath = 'dist/index.html';
let html = readFileSync(htmlPath, 'utf8');
html = html.replace('<html lang="en">', '<html lang="es">');
html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);
if (!html.includes('manifest.json')) {
  html = html.replace(
    '<title>Mis Gastos</title>',
    `<title>Mis Gastos</title>
    <meta name="description" content="Registra gastos personales y por proyecto, proformas y respaldos." />
    <meta name="theme-color" content="#0F766E" />
    <link rel="manifest" href="/mis-gastos/manifest.json" />
    <style>html, body, #root { background: #D5E3DE; }</style>`,
  );
}
writeFileSync(htmlPath, html);
copyFileSync(htmlPath, 'dist/404.html');
