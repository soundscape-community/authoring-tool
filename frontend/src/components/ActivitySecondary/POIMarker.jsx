// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';

const mapPinIcon = new Icon({
  iconUrl: 'static/media/map-pin-poi.png',
  iconSize: [42, 42],
  iconAnchor: [21, 37],
});

export default function POIMarker({ waypoint, editing, onWaypointMove }) {
  const title = waypoint.name;

  return (
    <Marker
      position={[waypoint.latitude, waypoint.longitude]}
      radius={10}
      pathOptions={{ color: 'red' }}
      title={title}
      icon={mapPinIcon}
      draggable={editing}
      eventHandlers={{
        dragend: (event) => {
          onWaypointMove(waypoint.id, event.target._latlng);
        },
      }}>
      <Popup>
        <strong>{title}</strong>
        <br />
        {waypoint.description && (
          <>
            {' '}
            <br />
            {waypoint.description}
            <br />
          </>
        )}
        <br />
        {waypoint.latitude}, {waypoint.longitude}
        {waypoint.departure_callout && (
          <>
            {' '}
            <br />
            <br />
            {`Departure Callout: ${waypoint.departure_callout}`}
          </>
        )}
        {waypoint.arrival_callout && (
          <>
            {' '}
            <br />
            {`Arrival Callout: ${waypoint.arrival_callout}`}
          </>
        )}
      </Popup>
    </Marker>
  );
}
