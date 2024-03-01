// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import gpxParser from 'gpxparser';

export const fileToGPX = async (gpxFile) => {
  if (!gpxFile || !(gpxFile instanceof File)) {
    return Promise.reject('Invalid GPX file');
  }
  
  console.log("getting to gpx parser");
  return new Promise((resolve, reject) => {
    gpxFile.text().then((text) => {
      const gpx = new gpxParser();
      gpx.parse(text);
      if (gpx) {
        resolve(gpx);
      } else {
        reject('Invalid GPX file');
      }
    });
  });
};

// alternative to fileToGPX to get rid of promises
export const getFileGPX = (gpxFile) => {
  if (!gpxFile || !(gpxFile instanceof File)) {
    return null;
  }

  console.log("getting gpx file");
  gpxFile.text().then((text) => {
    const gpx = new gpxParser();
    gpx.parse(text);
    if (gpx) {
      return gpx;
    } else {
      return null;
    }
  })
}

export const isGPXFileValid = async (gpxFile) => {
  return true;
  if (!gpxFile || !(gpxFile instanceof File)) {
    return false;
  }

  const gpx = await fileToGPX(gpxFile);
  // const gpx = getFileGPX(gpxFile);
  return isGPXObjectValid(gpx);
};

export const isGPXObjectValid = (gpx) => {
  if (gpx instanceof gpxParser === false) {
    return false;
  }
  return gpx.waypoints.length > 0 || gpx.tracks.length > 0 || gpx.routes.length > 0;
};
