// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';

export default function Footer() {
  return (
    <footer className="footer mt-auto py-3 text-center fixed-bottom text-light">
      <div className="container">
        <a className="text-light" href="https://www.yourcompany.com/contactus/" target="_blank" rel="noreferrer">
          Contact Us
        </a>{' '}
        <h1 className="text-3xl font-bold underline">
          Hello world!
        </h1>
        &middot;{' '}
        <a className="text-light" href="https://www.yourcompany.com/privacy/" target="_blank" rel="noreferrer">
          Privacy & Cookies
        </a>{' '}
        &middot;{' '}
        <a className="text-light" href="https://www.yourcompany.com/terms/" target="_blank" rel="noreferrer">
          Terms of Use
        </a>{' '}
        &middot;{' '}
        <a className="text-light" href="https://www.yourcompany.com/trademarks/" target="_blank" rel="noreferrer">
          Trademarks
        </a>{' '}
        &middot; &copy; {new Date().getFullYear()} Your Company
      </div>
    </footer>
  );
}
