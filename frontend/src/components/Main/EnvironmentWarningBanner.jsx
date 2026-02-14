// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React from 'react';
import { Alert } from 'react-bootstrap';

export default function EnvironmentWarningBanner({ message }) {
  return (
    <Alert className="mb-0 rounded-0 text-center" variant="warning">
      {message}
    </Alert>
  );
}
