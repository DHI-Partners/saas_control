// npm install --save-dev prisma dotenv
import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// DATABASE_URL живёт в корневом .env — единственном на монорепо
config({ path: path.resolve(process.cwd(), '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
