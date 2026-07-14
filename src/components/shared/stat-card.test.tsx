import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DollarSign } from 'lucide-react';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Revenue" value="$12,345" />);
    expect(screen.getByText('Revenue')).toBeDefined();
    expect(screen.getByText('$12,345')).toBeDefined();
  });

  it('renders icon when provided', () => {
    render(
      <StatCard
        title="Revenue"
        value="$12,345"
        icon={<DollarSign data-testid="icon" />}
      />,
    );
    expect(screen.getByTestId('icon')).toBeDefined();
  });

  it('renders positive trend indicator', () => {
    render(
      <StatCard
        title="Revenue"
        value="$12,345"
        trend={{ direction: 'up', label: '12% vs last week' }}
      />,
    );
    expect(screen.getByText(/↑/)).toBeDefined();
  });

  it('renders negative trend indicator', () => {
    render(
      <StatCard
        title="Revenue"
        value="$12,345"
        trend={{ direction: 'down', label: '5% vs last week' }}
      />,
    );
    expect(screen.getByText(/↓/)).toBeDefined();
  });
});
