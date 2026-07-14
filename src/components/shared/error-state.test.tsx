import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorState } from './error-state';

describe('ErrorState', () => {
  it('renders default error message', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });

  it('renders custom title and message', () => {
    render(
      <ErrorState
        title="Failed to load"
        message="Could not connect to the server."
      />,
    );
    expect(screen.getByText('Failed to load')).toBeDefined();
    expect(screen.getByText('Could not connect to the server.')).toBeDefined();
  });

  it('renders retry button and handles click', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
