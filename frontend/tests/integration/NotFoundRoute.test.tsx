import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import NotFoundPage from '../../src/pages/NotFoundPage.tsx';

describe('Not found route', () => {
  it('renders the 404 state', () => {
    const router = createMemoryRouter(
      [{ path: '*', element: <NotFoundPage /> }],
      { initialEntries: ['/nonexistent'] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByText('This page could not be found.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });
});