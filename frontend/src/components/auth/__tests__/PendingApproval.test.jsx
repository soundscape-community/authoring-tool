// Copyright (c) Soundscape Community Contributors.

import React from 'react';
import { render, screen } from '@testing-library/react';

import PendingApproval from '../PendingApproval';

describe('PendingApproval', () => {
  it('shows the pending approval message and return link', () => {
    render(<PendingApproval />);

    expect(screen.getByRole('heading', { name: 'Account pending approval.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to sign-in' })).toHaveAttribute('href', '/');
  });
});