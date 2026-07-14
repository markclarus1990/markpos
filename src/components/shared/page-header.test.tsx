import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeDefined();
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Dashboard" description="Overview of sales" />);
    expect(screen.getByText('Overview of sales')).toBeDefined();
  });

  it('renders actions when provided', () => {
    render(
      <PageHeader
        title="Dashboard"
        actions={<button>Action</button>}
      />,
    );
    expect(screen.getByText('Action')).toBeDefined();
  });
});
