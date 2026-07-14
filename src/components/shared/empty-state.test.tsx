import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No products"
        description="Get started by adding your first product."
      />,
    );
    expect(screen.getByText('No products')).toBeDefined();
    expect(screen.getByText('Get started by adding your first product.')).toBeDefined();
  });

  it('renders action button and handles click', async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No products"
        action={{ label: 'Add Product', onClick }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add Product' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
