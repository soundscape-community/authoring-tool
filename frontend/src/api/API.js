// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import Axios from 'axios';
import auth from './Auth';
import Activity from '../data/Activity';

const axios = Axios.create({
  baseURL: '/api/v1/',
  headers: {
    'content-type': 'application/json',
  },
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken'
});

axios.interceptors.response.use(
  function (response) {
    // We use this instead of doing this for every response: `.then((res) => res.data);`
    return response.data;
  },
  function (error) {
    return Promise.reject(error);
  },
);

const multipartRequestConfig = {
  headers: {
    'content-type': 'multipart/form-data',
  },
};

function objectToFormData(object) {
  const formData = new FormData();

  for (var propertyName in object) {
    if (object[propertyName] === undefined || object[propertyName] === null) {
      continue;
    }

    if (propertyName === 'image' && typeof object[propertyName] === 'string') {
      continue;
    }

    if (Array.isArray(object[propertyName])) {
      const values = object[propertyName];
      for (let i = 0; i < values.length; i++) {
        formData.append(`${propertyName}[]`, values[i]);
      }
    } else {
      formData.append(propertyName, object[propertyName]);
    }
  }

  return formData;
}

class API {

  // Activities

  async getActivities() {
    return axios.get('activities/').then((data) => {
      return data.map((data) => new Activity(data));
    });
  }

  async getActivity(id) {
    return axios.get(`activities/${id}/`).then((data) => {
      return new Activity(data);
    });
  }

  async createActivity(activity) {
    //TEST
    console.log("WOW");
    console.log(activity);
    const activity_ = Object.assign({}, activity);
    console.log(activity_);

    if (auth.isAuthenticated) {
      activity_.author_id = auth.userId;
      activity_.author_email = auth.userEmail;
    }

    // We use FormData as the object may contain a file (featured image)
    const formData = objectToFormData(activity_);
    //TEST
    console.log("FORM DATA");
    console.log(formData);
    return axios.post('activities/', formData, multipartRequestConfig).then((data) => {
      console.log(data);
      return new Activity(data);
    });
  }

  async importActivity(gpx) {
    //TEST
    console.log("IMPORT GPX DATA");
    console.log(gpx);
    const formData = objectToFormData({ gpx });
    return axios.post('activities/import_gpx/', formData, multipartRequestConfig).then((data) => {
      console.log(data);
      return new Activity(data);
    });
  }

  async updateActivity(activity) {
    // We use FormData as the object may contain a file (featured image)
    const formData = objectToFormData(activity);
    return axios.put(`activities/${activity.id}/`, formData, multipartRequestConfig).then((data) => {
      return new Activity(data);
    });
  }

  async deleteActivity(activityId) {
    return axios.delete(`activities/${activityId}/`);
  }

  async duplicateActivity(activityId) {
    return axios.post(`activities/${activityId}/duplicate/`).then((data) => {
      return new Activity(data);
    });
  }

  async publishActivity(activityId) {
    return axios.post(`activities/${activityId}/publish/`).then((data) => {
      return new Activity(data);
    });
  }

  // Waypoints

  async createWaypoint(waypoint) {
    // We use FormData as the object may contain a file (featured image)
    const formData = objectToFormData(waypoint);
    return axios.post(`waypoints/`, formData, multipartRequestConfig);
  }

  async updateWaypoint(waypoint) {
    // We use FormData as the object may contain a file (featured image)
    const formData = objectToFormData(waypoint);
    return axios.put(`waypoints/${waypoint.id}/`, formData, multipartRequestConfig);
  }

  async updateWaypointIndex(waypoint, offset) {
    const object = {
      waypoint: waypoint,
      offset: offset,
    };
    return axios.put(`waypoints/${waypoint.id}/`, object);
  }

  async deleteWaypoint(waypointId) {
    return axios.delete(`waypoints/${waypointId}/`);
  }

  // Waypoint Media

  async deleteWaypointMedia(waypointMediaId) {
    return axios.delete(`waypoints_media/${waypointMediaId}/`);
  }
}

export default new API();
