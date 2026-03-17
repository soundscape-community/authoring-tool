// Copyright (c) Soundscape Community Contributors.

import React from 'react';
import './Login.css';
import './PendingApproval.css';

function PendingApproval() {
  return (
    <div className="wrapper">
      <div className="centered_container">
        <section className="pending_card" aria-live="polite">
          <h1 className="pending_title">Account pending approval.</h1>
          <p className="pending_copy">
            Your Google sign-in was received, but a staff member still needs to approve this account.
          </p>
          <p className="pending_copy">
            Once approved, return to the sign-in page and continue with Google again.
          </p>
          <a href="/" className="button pending_link">Back to sign-in</a>
        </section>
      </div>
    </div>
  );
}

export default PendingApproval;