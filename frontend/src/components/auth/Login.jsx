// Copyright (c) Soundscape Community Contributors.
// Copyright    (c) Robbie Murray
// Licence:     <MIT>
// Login component for the frontend

import React, { useContext } from "react";
import { showError } from "../../utils/Toast";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import auth from "../../api/Auth";
import MainContext from '../Main/MainContext';
import './Login.css'

function Login() {
  const { setUser } = useContext(MainContext);
  const googleLoginUrl = '/accounts/google/login/?auth_params=prompt%3Dselect_account';

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
                <a href={googleLoginUrl} className="button google_button">Continue with Google</a>
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
