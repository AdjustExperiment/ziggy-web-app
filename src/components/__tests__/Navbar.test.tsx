import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { vi } from 'vitest';

vi.mock('@/hooks/useOptimizedAuth', () => ({
  useOptimizedAuth: () => ({
    user: null,
    profile: null,
    signOut: vi.fn(),
    isAdmin: false,
  }),
}));

vi.mock('@/components/LazyImage', () => ({
  LazyImage: (props: any) => <img {...props} />,
}));

describe('Navbar', () => {
  it('renders brand name', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(screen.getByText(/Ziggy Online Debate/i)).toBeInTheDocument();
  });
});
