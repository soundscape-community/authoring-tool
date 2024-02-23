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

function Login({ }) {
  const { user, setUser } = useContext(MainContext);

  const handleLogin = async ({username, password}) => {
    try {
      await auth.login(username, password);
    } catch (error) {
      console.log(error);
      error.title = 'Invalid login attempt'
      showError(error); // do show error on frontend when unsuccessful login
    }
    setUser(await auth.fetchAuthInfo());
    window.location.reload(true);
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
              <button type="submit" disabled={isSubmitting} className="button">Login</button>
            </Form>
          </div>
        }
      </Formik>
    </div>
  );
};

export default Login;
