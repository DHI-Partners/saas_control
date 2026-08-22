import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Проксирование /api/* на NestJS живёт в src/app/api/[...path]/route.ts,
 * а не в rewrites: rewrite вычисляется на этапе сборки, и один и тот же
 * докер-образ нельзя было бы переключить на другой бэкенд переменной BACKEND_URL.
 */
const nextConfig: NextConfig = {
  // standalone включается только в докер-сборке: с ним не работает `next start`
  ...(process.env.NEXT_OUTPUT_STANDALONE
    ? {
        output: 'standalone' as const,
        // трейсинг файлов должен видеть весь монорепо, иначе в standalone
        // не попадут зависимости из корневого node_modules
        outputFileTracingRoot: path.join(process.cwd(), '..', '..'),
      }
    : {}),
};

export default nextConfig;
