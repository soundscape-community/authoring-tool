// Copyright (c) Soundscape Community Contributors.

import React from 'react';
import { render, screen } from '@testing-library/react';

import MainContext from '../../Main/MainContext';
import Login from '../Login';

describe('Login', () => {
  it('renders a Google sign-in link', () => {
    render(
      <MainContext.Provider value={{ setUser: () => {} }}>
        <Login />
      </MainContext.Provider>,
    );

    expect(screen.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
      'href',
      '/accounts/google/login/?auth_params=prompt%3Dselect_account',
    );
  });
});