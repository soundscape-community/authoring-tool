// Copyright    (c) Robbie Murray
// Licence:     <MIT>
// Login component for the frontend

import React, { useContext, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import auth from "../../api/Auth";
import MainContext from '../Main/MainContext';

function Login({ }) {
  const { user, setUser } = useContext(MainContext);

  const handleLogin = async ({username, password}) => {
    try {
      await auth.login(username, password);
    } catch (error) {
      console.log(error);
    }
    setUser(await auth.fetchAuthInfo());
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string().required("Username is required"),
    password: Yup.string().required("Password is required"),
  });

  return (
    <Formik
      initialValues={{ username: "", password: "" }}
      validationSchema={validationSchema}
      onSubmit={handleLogin}
    >
      {({ isSubmitting }) =>
        <Form>
          <div>
            <label>
              Username
              <Field type="text" id="username" name="username" />
            </label>
            <ErrorMessage name="username" component="div" />
          </div>
          <div>
            <label>
              Password
              <Field type="password" id="password" name="password" />
            </label>
            <ErrorMessage name="password" component="div" />
          </div>
          <button type="submit" disabled={isSubmitting}>Login</button>
        </Form>
      }
    </Formik>
  );
};

export default Login;
