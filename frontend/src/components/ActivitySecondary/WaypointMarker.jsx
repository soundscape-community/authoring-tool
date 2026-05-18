// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { Icon } from 'leaflet';

import waypointIcon from '../../media/updated-map-pin.svg';

const mapPinIcon = new Icon({
  iconUrl: waypointIcon,
  iconSize: [38, 38],
  iconAnchor: [20, 37],
});

export default function WaypointMarker({ waypoint, editing, onWaypointMove }) {
  const title = `${waypoint.index + 1}. ${waypoint.name}`;
  return (
    <Marker
      position={[waypoint.latitude, waypoint.longitude]}
      title={title}
      icon={mapPinIcon}
      draggable={editing}
      eventHandlers={{
        dragend: (event) => {
          onWaypointMove(waypoint.id, event.target._latlng);
        },
      }}>
      <Tooltip permanent>{`${waypoint.index + 1}`}</Tooltip>
      <Popup>
        <strong>{`${waypoint.index + 1}. ${waypoint.name}`}</strong>
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
