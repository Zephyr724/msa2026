import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/App.tsx';

describe('App shell', () => {
  it('renders the foundation home page', () => {
    render(<App />);

    expect(screen.getByText('Kiwimpact')).toBeInTheDocument();
    expect(
      screen.getByText('Community eco quests across New Zealand'),
    ).toBeInTheDocument();
  });
});