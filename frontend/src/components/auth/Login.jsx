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

  const handleSignUp = async ({username, email, password, confirmPassword}) => {
    try {
      await auth.signup(username, email, password, confirmPassword);
    } catch (error) {
      console.log(error);
    }
    //setUser(await auth.fetchAuthInfo());
    window.location.reload(true);
  }

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

  const validationSchemaSignUp = Yup.object().shape({
    username: Yup.string()
      .required("Username is required")
      .min(5, "Must be at least 5 characters")
      .max(25, "Must be less than 25 characters")
      .matches(/^\S*$/, 'Input must not contain whitespace')
      .matches(/^[a-zA-Z0-9]*$/, 'Input must not contain non-alphanumeric characters'),
    email: Yup.string()
      .required('Email is required')
      .email('Invalid email address'),
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters long')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/^.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*$/, 'Password must contain at least one special character'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Please confirm your password'),
  });

  const [showSignUp, setShowSignUp] = useState(false);

  const handleSignUpButtonClick = () => {
    setShowSignUp(true);
  };

  const handleLogInButtonClick = () => {
    setShowSignUp(false);  
  };

  return (
    <>
      { showSignUp && (
        <div className="sign_up_wrapper">
          <Formik
            initialValues={{ username: "", email: "", password: "", confirmPassword: ""}}
            validationSchema={validationSchemaSignUp}
            onSubmit={handleSignUp}
          >
            <div className="centered_container">
              <Form>
                <div>
                  <label>
                    Enter a username:
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <Field type="text" id="username" name="username" className="field" />
                  </label>
                  <ErrorMessage name="username" component="div" className="error" />
                </div>

                <div>
                  <label>
                    Enter an email address:
                    &nbsp;&nbsp;
                    <Field type="email" id="email" name="email" className="field"/>
                  </label>
                  <ErrorMessage name="email" component="div" className="error" />
                </div>

                <div>
                  <label>
                    Enter a password:
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <Field type="password" id="password" name="password" className="field" />
                  </label>
                  <ErrorMessage name="password" component="div" className="error" />
                </div>

                <div>
                  <label>
                    Re-enter your password:
                    <Field type="password" id="confirmPassword" name="confirmPassword" className="field" />
                  </label>
                  <ErrorMessage name="confirmPassword" component="div" className="error" />
                </div>

                <div className="button_container">
                  <button type="submit" className="button_sign_in" style={{ marginRight: '5px', width: '25%' }}>Submit</button>
                  <button type="button" className="button_sign_in" onClick={handleLogInButtonClick} style={{ backgroundColor: 'transparent', color: '#253d62', textDecoration: 'underline', width: '75%' }}>Already a user? Log in!</button>
                </div>
                
              </Form>
            </div>
          </Formik>
        </div>
      )}

      <div className="sign_in_wrapper">
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
                <div className="button_container">
                  <button type="submit" disabled={isSubmitting} className="button_login">Login</button>
                  <button type="button" className="button_login" onClick={handleSignUpButtonClick} style={{ backgroundColor: 'transparent', color: '#253d62', textDecoration: 'underline' }}>Sign up!</button>
                </div>
              </Form>
            </div>
          }
        </Formik>
      </div>
    </>
  );
};

export default Login;
