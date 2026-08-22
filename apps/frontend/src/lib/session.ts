import { redirect } from 'next/navigation';
import { ApiError, type Profile } from './api';
import { sessionApi } from './api.server';

/** Профиль вошедшего клиента. Без сессии — на страницу входа. */
export async function requireProfile(): Promise<Profile> {
  const profile = await currentProfile();
  if (!profile) redirect('/login');
  return profile;
}

/** Профиль или null: для страниц, которые открыты и гостям. */
export async function currentProfile(): Promise<Profile | null> {
  const api = await sessionApi();

  try {
    return await api.me.profile();
  } catch (error) {
    // 401 — обычное состояние гостя, а не сбой
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
