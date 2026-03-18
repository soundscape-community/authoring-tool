// Copyright (c) Soundscape Community Contributors.

import React from 'react';
import { render, screen } from '@testing-library/react';

import MainContext from '../../Main/MainContext';
import Login from '../Login';

describe('Login', () => {
  it('renders a Google sign-in button', () => {
    render(
      <MainContext.Provider value={{ setUser: () => {} }}>
        <Login />
      </MainContext.Provider>,
    );

    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
  });
});