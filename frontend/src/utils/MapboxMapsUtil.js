// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// More info: https://docs.microsoft.com/en-us/rest/api/maps/render-v2/get-map-tile

export const osmMapAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const osmMapsTilesetIDs = [
  { name: 'Default', id: 'microsoft.base.road', default: true },
  { name: 'Dark', id: 'microsoft.base.darkgrey' },
  { name: 'Satellite', id: 'microsoft.imagery' },
];

let defaultMapOptions = {
  tilesetId: '{s}',
  tileSize: '256',
  language: 'en-US',
  view: 'Auto',
};

export const osmMapUrl = (tilesetId = defaultMapOptions.tilesetId) => {
  return `https://${tilesetId}.tile.openstreetmap.org/{z}/{x}/{y}.png`;
  // return `/map/?tileset_id=${tilesetId}&tile_size=${defaultMapOptions.tileSize}&language=${defaultMapOptions.language}&view=${defaultMapOptions.view}&zoom={z}&x={x}&y={y}`;
};


// import mapboxgl from 'mapbox-gl'; // or "const mapboxgl = require('mapbox-gl');"

// // TO MAKE THE MAP APPEAR YOU MUST
// // ADD YOUR ACCESS TOKEN FROM
// // https://account.mapbox.com
// mapboxgl.accessToken = 'pk.eyJ1IjoibWVyY3VyeWhnMzEiLCJhIjoiY2xvb3dyNTVnMDQwMjJqcDg1b3U5dm1wNyJ9.PUyGga-0eHFryH8mO9Rk7A';
// const map = new mapboxgl.Map({
//     container: 'map', // container ID
//     style: 'mapbox://styles/mapbox/streets-v12', // style URL
//     center: [-74.5, 40], // starting position [lng, lat]
//     zoom: 9, // starting zoom
// });
