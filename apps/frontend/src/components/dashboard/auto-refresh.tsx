'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Перерисовывает серверную страницу по таймеру. Нужен там, где состояние
 * меняет не кабинет, а bench: развёртывание сайта идёт минутами и своих
 * событий наружу не шлёт, так что остаётся опрашивать.
 */
export function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);

  return null;
}
