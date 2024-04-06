// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';

export default function Footer() {
  return (
    <footer className="footer mt-auto py-3 text-center fixed-bottom text-light">
      <div className="container">
        <a className="text-light" href="https://ialabs.ie/privacy-policy/" target="_blank" rel="noreferrer">
          Privacy Policy
        </a>{' '}
        &middot; &copy; {new Date().getFullYear()} Soundscape Community
      </div>
    </footer>
  );
}
