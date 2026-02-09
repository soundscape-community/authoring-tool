// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// Copyright (c) Soundscape Community Contributors.

import Axios from 'axios';
import auth from './Auth';
import Activity from '../data/Activity';
import axiosDefaults from './axiosDefaults';

const axios = Axios.create({
  ...axiosDefaults,
  baseURL: '/api/v1/',
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

  async getActivities(folderId = null) {
    const params = {};
    if (folderId === null) {
      params.folder_id = 'none';
    } else if (folderId) {
      params.folder_id = folderId;
    }
    return axios.get('activities/', { params }).then((data) => {
      return data.map((data) => new Activity(data));
    });
  }

  async getActivity(id) {
    return axios.get(`activities/${id}/`).then((data) => {
      return new Activity(data);
    });
  }

  async createActivity(activity) {
    const activity_ = Object.assign({}, activity);

    if (auth.isAuthenticated) {
      activity_.author_id = auth.userId;
      activity_.author_email = auth.userEmail;
    }

    // We use FormData as the object may contain a file (featured image)
    const formData = objectToFormData(activity_);
    return axios.post('activities/', formData, multipartRequestConfig).then((data) => {
      return new Activity(data);
    });
  }

  async importActivity(gpx) {
    const formData = objectToFormData({ gpx });
    return axios.post('activities/import_gpx/', formData, multipartRequestConfig).then((data) => {
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

  async updateActivityPartial(activity) {
    return axios.patch(`activities/${activity.id}/`, activity).then((data) => {
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

  // Folders

  async getFolders() {
    return axios.get('folders/');
  }

  async createFolder(folder) {
    return axios.post('folders/', folder);
  }

  async updateFolder(folder) {
    return axios.put(`folders/${folder.id}/`, folder);
  }

  async deleteFolder(folderId) {
    return axios.delete(`folders/${folderId}/`);
  }

  // Folder permissions

  async getFolderPermissions() {
    return axios.get('folder_permissions/');
  }

  async createFolderPermission(permission) {
    return axios.post('folder_permissions/', permission);
  }

  async updateFolderPermission(permission) {
    return axios.put(`folder_permissions/${permission.id}/`, permission);
  }

  async deleteFolderPermission(permissionId) {
    return axios.delete(`folder_permissions/${permissionId}/`);
  }

  // Groups

  async getGroups() {
    return axios.get('groups/');
  }

  async createGroup(group) {
    return axios.post('groups/', group);
  }

  // Group memberships

  async getGroupMemberships() {
    return axios.get('group_memberships/');
  }

  async createGroupMembership(membership) {
    return axios.post('group_memberships/', membership);
  }

  async deleteGroupMembership(membershipId) {
    return axios.delete(`group_memberships/${membershipId}/`);
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

  async deleteWaypoint(waypointId) {
    return axios.delete(`waypoints/${waypointId}/`);
  }

  // Waypoint Media

  async deleteWaypointMedia(waypointMediaId) {
    return axios.delete(`waypoints_media/${waypointMediaId}/`);
  }
}

export default new API();
