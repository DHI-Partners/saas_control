import type { PublicClient } from '../clients/client.select';

declare global {
  namespace Express {
    interface Request {
      /** Заполняется SessionGuard для приватных роутов. */
      client?: PublicClient;
    }
  }
}

export {};
