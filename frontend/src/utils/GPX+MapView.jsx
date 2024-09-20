// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { Marker, Polyline, Popup, Tooltip } from 'react-leaflet';

export const GPXMapOverlaysBounds = (gpx) => {
  if (!gpx) {
    return [];
  }

  let bounds = gpx.waypoints.map((waypoint) => [waypoint.latitude, waypoint.longitude]);

  gpx.routes.forEach((route) => {
    bounds = bounds.concat(route.points.map((point) => [point.latitude, point.longitude]));
  });

  gpx.tracks.forEach((track) => {
    bounds = bounds.concat(track.points.map((point) => [point.latitude, point.longitude]));
  });

  return bounds;
};

export const GPXMapOverlays = (gpx) => {
  if (!gpx) {
    return null;
  }

  let overlays = [];

  gpx.waypoints.forEach((waypoint, index) => {
    const name = waypoint.name ?? 'Waypoint';

    const overlay = (
      <Marker
        key={`${waypoint.latitude},${waypoint.longitude},${index}`}
        position={[waypoint.latitude, waypoint.longitude]}
        title={name}
        draggable={false}>
        <Tooltip>{name}</Tooltip>
        <Popup>{name}</Popup>
      </Marker>
    );
    overlays.push(overlay);
  });

  gpx.routes.forEach((route, index) => {
    const coordinates = route.points.map((point) => [point.latitude, point.longitude]);
    if (coordinates.length > 0) {
      const name = route.name ?? 'Route';

      const overlay = (
        <Polyline key={`route-polyline-${index}`} pathOptions={{ color: 'turquoise' }} positions={coordinates}>
          <Popup>
            <strong>{name}</strong>
            {route.distance?.total && (
              <>
                <br />
                Distance: {route.distance.total.toFixed(2)} m
              </>
            )}
          </Popup>
        </Polyline>
      );
      overlays.push(overlay);
    }
  });

  gpx.tracks.forEach((track, index) => {
    const coordinates = track.points.map((point) => [point.latitude, point.longitude]);
    if (coordinates.length > 0) {
      const name = track.name ?? 'Track';

      const overlay = (
        <Polyline key={`track-polyline-${index}`} pathOptions={{ color: 'purple' }} positions={coordinates}>
          <Popup>
            <strong>{name}</strong>
            {track.distance?.total && (
              <>
                <br />
                Distance: {track.distance.total.toFixed(2)} m
              </>
            )}
          </Popup>
        </Polyline>
      );
      overlays.push(overlay);
    }
  });

  return overlays;
};
