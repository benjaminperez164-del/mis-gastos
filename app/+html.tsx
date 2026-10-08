import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';
import { BASE_PATH } from '@/src/config';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content="#0F766E" />
        <meta name="description" content="Registra gastos personales y por proyecto, proformas y respaldos." />
        <link rel="manifest" href={`${BASE_PATH}/manifest.json`} />
        <link rel="icon" href={`${BASE_PATH}/favicon.png`} />
        <title>Mis Gastos</title>
        <ScrollViewStyleReset />
        <style
          id="shell"
          dangerouslySetInnerHTML={{
            __html: `html, body, #root { height: 100%; background: #D5E3DE; } body { margin: 0; }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
