import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecheckButton } from '../recheck-button';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RecheckButton', () => {
  it('по клику показывает время из ответа бэкенда', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ status: 'ok', now: '2026-08-18T15:25:04.398Z' }),
            { status: 200 },
          ),
        ),
    );

    render(<RecheckButton />);
    await userEvent.click(screen.getByRole('button'));

    expect(
      await screen.findByText('2026-08-18T15:25:04.398Z'),
    ).toBeInTheDocument();
  });

  it('показывает текст ошибки, если API недоступен', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );

    render(<RecheckButton />);
    await userEvent.click(screen.getByRole('button'));

    expect(await screen.findByText(/ECONNREFUSED/)).toBeInTheDocument();
  });
});
