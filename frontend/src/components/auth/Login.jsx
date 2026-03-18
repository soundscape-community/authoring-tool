// Copyright (c) Soundscape Community Contributors.
// Copyright    (c) Robbie Murray
// Licence:     <MIT>
// Login component for the frontend

import React, { useContext, useState } from "react";
import { showError } from "../../utils/Toast";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import auth from "../../api/Auth";
import MainContext from '../Main/MainContext';
import './Login.css'

function getCookieValue(name) {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
}

function Login() {
  const { setUser } = useContext(MainContext);
  const googleLoginUrl = '/accounts/google/login/?auth_params=prompt%3Dselect_account';
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleLogin = async ({username, password}) => {
    try {
      await auth.login(username, password);
    } catch (error) {
      error.title = 'Invalid login attempt'
      showError(error);
      return;
    }
    setUser(await auth.fetchAuthInfo());
    window.location.reload();
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string().required("Username is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);

    try {
      const response = await fetch('/api/auth/csrf/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Unable to prepare Google sign-in.');
      }

      const csrfToken = getCookieValue('csrftoken');
      if (!csrfToken) {
        throw new Error('Missing CSRF token for Google sign-in.');
      }

      const form = document.createElement('form');
      form.method = 'post';
      form.action = googleLoginUrl;
      form.className = 'google_login_form';

      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfmiddlewaretoken';
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      error.title = 'Google sign-in unavailable';
      showError(error);
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="wrapper">
      <Formik
        initialValues={{ username: "", password: "" }}
        validationSchema={validationSchema}
        onSubmit={handleLogin}
      >
        {({ isSubmitting }) =>
          <div className="centered_container">
            <Form>
              <div>
                <label>
                  Username
                  <Field type="text" id="username" name="username" className="field" />
                </label>
                <ErrorMessage name="username" component="div" className="error"/>
              </div>
              <div>
                <label>
                  Password
                  <Field type="password" id="password" name="password" className="field" />
                </label>
                <ErrorMessage name="password" component="div" className="error"/>
              </div>
              <div className="auth_actions">
                <button type="submit" disabled={isSubmitting} className="button">Login</button>
                <button
                  type="button"
                  disabled={isGoogleSubmitting}
                  className="button google_button"
                  onClick={handleGoogleLogin}
                >
                  Continue with Google
                </button>
              </div>
              <p className="auth_notice">
                New Google sign-ins require staff approval before access is granted.
              </p>
            </Form>
          </div>
        }
      </Formik>
    </div>
  );
};

export default Login;
