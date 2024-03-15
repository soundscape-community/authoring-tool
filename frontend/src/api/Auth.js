// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import Axios from 'axios';

const axios = Axios.create({
  baseURL: '/dj-rest-auth/',
  headers: {
    'content-type': 'application/json',
  },
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken'
});

class Auth {
  constructor() {
    this.authResponse = null;
    this.userEmail = null;
    this.userName = null;
    this.idToken = null;
  }

  get isAuthenticated() {
    return this.authResponse != null;
  }

  async fetchAuthInfo() {
    let res = await axios.get('user/');
    res = res.data;
    if (!res.username) {
      throw Error('Invalid authentication response. Should contain user name.');
    }

    this.authResponse = res;
    this.userId = res.pk;
    this.userEmail = res.email;
    this.userName = res.username;

    let user = {
      userId: this.userId,
      userEmail: this.userEmail,
      userName: this.userName,
    };

    return user;
  }

  async logout() {
    await axios.post('logout/');
    this.authResponse = null;
    this.userName = null;
    this.userEmail = null;
  }

  async login(username, password) {
    let res = await axios.post('login/', { username, password });
    res = res.data;

//    if (!res.key) {
//      throw Error('Invalid authentication response. Should contain key.');
//    }

    this.idToken = 'fixme';
    return await this.fetchAuthInfo();
  }
    
};

export default new Auth();
