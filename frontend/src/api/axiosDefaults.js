// Copyright (c) Soundscape Community Contributors.

/**
 * Shared Axios defaults for Django CSRF integration.
 */
const axiosDefaults = {
  headers: { 'content-type': 'application/json' },
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
};

export default axiosDefaults;
