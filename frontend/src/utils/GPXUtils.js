// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { parseGPX } from "@we-gold/gpxjs"
export const fileToGPX = async (gpxFile) => {
  if (!gpxFile || !(gpxFile instanceof File)) {
    return Promise.reject('Invalid GPX file');
  }

  return new Promise((resolve, reject) => {
    gpxFile.text().then((text) => {
      const [gpx, error] = parseGPX(text);
      if (error) {
        reject('Invalid GPX file');
        } else {
        resolve(gpx);
      }
    });
  });
};

export const isGPXFileValid = async (gpxFile) => {
  if (!gpxFile || !(gpxFile instanceof File)) {
    return false;
  }

  const gpx = await fileToGPX(gpxFile);
  return isGPXObjectValid(gpx);
};

export const isGPXObjectValid = (gpx) => {
  return gpx.waypoints.length > 0 || gpx.tracks.length > 0 || gpx.routes.length > 0;
};
