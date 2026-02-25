// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// Copyright (c) Soundscape Community Contributors.

import Axios from 'axios';
import axiosDefaults from './axiosDefaults';

const axios = Axios.create({
  ...axiosDefaults,
  baseURL: '/dj-rest-auth/',
});

class Auth {
  constructor() {
    this.authResponse = null;
    this.userEmail = null;
    this.userName = null;
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

    return await this.fetchAuthInfo();
  }
    
};

export default new Auth();
