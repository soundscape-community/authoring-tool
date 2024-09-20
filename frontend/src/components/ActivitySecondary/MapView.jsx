// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  useMapEvent,
  useMap,
  Popup,
  LayersControl,
  AttributionControl,
  LayerGroup,
} from 'react-leaflet';
import { OverlayTrigger, ToggleButton, ToggleButtonGroup, Tooltip } from 'react-bootstrap';
import { LatLngBounds } from 'leaflet';
import WaypointMarker from './WaypointMarker';
import API from '../../api/API';
import { showError, showLoading, dismissLoading } from '../../utils/Toast';
import { GPXMapOverlaysBounds, GPXMapOverlays } from '../../utils/GPX+MapView';
import { GitPullRequest, MapPin } from 'react-feather';
import POIMarker from './POIMarker';
import Waypoint from '../../data/Waypoint';
import Activity from '../../data/Activity';

const DEFAULT_MAP_BOUNDS = [[47.64203029829583, -122.14126189681534]];

const OSM_ATTR = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

function shouldShowWaypointCreationControl(activity) {
  switch (activity.type) {
    case Activity.TYPE.ORIENTEERING:
      return false;
    case Activity.TYPE.GUIDED_TOUR:
      return true;
    default:
      return false;
  }
}

function OnMapClick({ onMapClicked }) {
  useMapEvent('click', (event) => {
    // This solves an issue where some map overlay elements,
    // like buttons are passing clicks to the map.
    const className = event.originalEvent.target.className;
    if (typeof className !== 'string') {
      return;
    }
    if (className.includes('leaflet') === false) {
      return;
    }

    onMapClicked(event);
  });
  return null;
}

function CenterMap({ coordinate }) {
  const map = useMap();
  map.setView(coordinate);
  return null;
}

let locatingUser = false;

function LocateUser({ onUserLocationUpdated }) {
  const map = useMap();

  let toastId = useRef();

  useMapEvent('locationfound', (event) => {
    map.stopLocate();
    map.setView(event.latlng);
    dismissLoading(toastId.current);
    onUserLocationUpdated([event.latlng.lat, event.latlng.lng]);
    locatingUser = false;
  });

  useMapEvent('locationerror', (error) => {
    map.stopLocate();
    dismissLoading(toastId.current);
    error.title = 'Error locating user';
    showError(error);
    locatingUser = false;
  });

  if (!locatingUser) {
    locatingUser = true;
    toastId.current = showLoading('Getting location...');
    map.locate();
  }

  return null;
}

function isLatLngValue(latlng) {
  return latlng.lat >= -90 && latlng.lat <= 90 && latlng.lng >= -180 && latlng.lng <= 180;
}

function WaypointCreationControl({ value, onChange }) {
  return (
    <div className="leaflet-bottom leaflet-left">
      <div className="leaflet-control leaflet-bar">
        <OverlayTrigger
          placement="top"
          delay={{ show: 400, hide: 0 }}
          overlay={
            <Tooltip id="waypoints-creation-button-tooltip">
              Select which item will be created when clicking on the map
            </Tooltip>
          }>
          <ToggleButtonGroup size="sm" type="radio" name="Waypoint Creation Control" value={value} onChange={onChange}>
            <ToggleButton id={Waypoint.TYPE.WAYPOINT} value={Waypoint.TYPE.WAYPOINT}>
              <GitPullRequest size={16} style={{ verticalAlign: 'text-bottom' }} /> Waypoints
            </ToggleButton>
            <ToggleButton id={Waypoint.TYPE.POI} value={Waypoint.TYPE.POI}>
              <MapPin size={16} style={{ verticalAlign: 'text-bottom' }} /> Points of Interest
            </ToggleButton>
          </ToggleButtonGroup>
        </OverlayTrigger>
      </div>
    </div>
  );
}

export default function MapView(props) {
  const [creatingWaypoint, setCreatingWaypoint] = useState(false);
  const [geolocationPermissionGranted, setGeolocationPermissionGranted] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [waypointCreationType, setWaypointCreationType] = useState(Waypoint.TYPE.WAYPOINT);

  const mapRef = useRef();

  useEffect(() => {
    queryGeolocationPermission();
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      configureMapCursor();
    }
  }, [mapRef]);

  useEffect(() => {
    if (mapRef.current ) {
      mapRef.current.fitBounds(bounds());
    }
  }, [props.mapOverlay]);

  function queryGeolocationPermission() {
    if (!navigator.geolocation) {
      return;
    }

    // Some browsers do not support `permissions`
    // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/permissions
    if (!navigator.permissions) {
      setGeolocationPermissionGranted(true);
      return;
    }

    navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
      if (result.state === 'granted' || result.state === 'prompt') {
        setGeolocationPermissionGranted(true);
      }
    });
  }

  // Computed properties

  function bounds() {
    let bounds = null;

    if (props.mapOverlay) {
      bounds = GPXMapOverlaysBounds(props.mapOverlay);
    } else {
      let coordinates = props.activity.waypoints_group.waypoints.map((waypoint) => [
        waypoint.latitude,
        waypoint.longitude,
      ]);

      if (props.activity.pois_group) {
        coordinates.concat(
          props.activity.pois_group.waypoints.map((waypoint) => [waypoint.latitude, waypoint.longitude]),
        );
      }

      if (coordinates.length > 0) {
        bounds = coordinates;
      } else if (userLocation) {
        bounds = [userLocation];
      } else {
        bounds = DEFAULT_MAP_BOUNDS;
      }
    }

    let paddedBounds = new LatLngBounds(bounds).pad(0.1);
    return paddedBounds;
  }

  function waypointMarkers() {
    const waypoints = props.activity.waypoints_group.waypoints;
    if (waypoints.length === 0) {
      return null;
    }

    return waypoints.map((waypoint) => (
      <WaypointMarker
        key={waypoint.id}
        waypoint={waypoint}
        editing={props.editing}
        onWaypointMove={onWaypointMove}
      />
    ));
  }

  function waypointMarkersPolyline() {
    const coordinates = props.activity.waypoints_group.waypoints.map((waypoint) => [
      waypoint.latitude,
      waypoint.longitude,
    ]);

    if (coordinates.length === 0) {
      return null;
    }

    return (
      <Polyline key="markers-polyline" pathOptions={{ color: 'blue' }} positions={coordinates}>
        <Tooltip>Waypoints Route</Tooltip>
        <Popup>Waypoints Route</Popup>
      </Polyline>
    );
  }

  function poiMarkers() {
    if (!props.activity.pois_group) {
      return null;
    }

    const waypoints = props.activity.pois_group.waypoints;
    if (waypoints.length === 0) {
      return null;
    }

    return waypoints.map((waypoint) => (
      <POIMarker
        key={waypoint.id}
        waypoint={waypoint}
        editing={props.editing}
        onWaypointMove={onWaypointMove}
      />
    ));
  }

  // Actions

  function onWaypointCreationTypeChanged(value) {
    setWaypointCreationType(value);
  }

  function onUserLocationUpdated(userLocation) {
    setUserLocation(userLocation);
  }

  function onMapClicked(event) {
    if (!props.editing || !isLatLngValue(event.latlng) || creatingWaypoint) {
      return;
    }

    setCreatingWaypoint(true);

    const waypointGroup = props.activity.waypointGroupByType(waypointCreationType);
    const name = Waypoint.typeTitle(waypointCreationType);

    const waypoint = {
      group: waypointGroup.id,
      name: name,
      description: null,
      latitude: event.latlng.lat.toFixed(6),
      longitude: event.latlng.lng.toFixed(6),
      // The `index` property will be set (if needed) by the server using the latest index + 1
    };

    const toastId = showLoading(`Creating ${name}...`);

    API.createWaypoint(waypoint)
      .then((waypoint) => {
        props.onWaypointCreated(waypoint);
        dismissLoading(toastId);
      })
      .catch((error) => {
        dismissLoading(toastId);
        error.title = `Error creating ${name}`;
        showError(error);
      })
      .finally(() => {
        setCreatingWaypoint(false);
      });
  }

  function onWaypointMove(waypointId, coordinate) {
    let waypoint = props.activity.waypoints_group.waypoints.find((waypoint) => waypoint.id === waypointId);
    if (!waypoint && props.activity.pois_group) {
      waypoint = props.activity.pois_group.waypoints.find((waypoint) => waypoint.id === waypointId);
    }

    const waypoint_ = Object.assign({}, waypoint);

    waypoint_.latitude = coordinate.lat.toFixed(6);
    waypoint_.longitude = coordinate.lng.toFixed(6);

    const toastId = showLoading('Updating waypoint...');

    API.updateWaypoint(waypoint_)
      .then((waypoint) => {
        dismissLoading(toastId);
        props.onWaypointUpdated(waypoint);
      })
      .catch((error) => {
        dismissLoading(toastId);
        error.title = 'Error updating waypoint';
        showError(error);
      });
  }

  function configureMapCursor() {
    if (!mapRef.current) {
      return;
    }

    if (props.editing && mapRef.current.style.cursor !== MapView.CURSOR_TYPE.CROSSHAIR) {
      mapRef.current.style.cursor = MapView.CURSOR_TYPE.CROSSHAIR;
    } else if (!props.editing && mapRef.current.style.cursor !== MapView.CURSOR_TYPE.DEFAULT) {
      mapRef.current.style.cursor = MapView.CURSOR_TYPE.DEFAULT;
    }
  }

  let shouldLocateUser =
    geolocationPermissionGranted &&
    props.activity.waypoints_group.waypoints.length === 0 &&
    !userLocation;

  let selectedWaypointCoordinate = props.selectedWaypoint
    ? [props.selectedWaypoint.latitude, props.selectedWaypoint.longitude]
    : null;

  return (
    <MapContainer bounds={bounds()} zoom={19} worldCopyJump={true} ref={mapRef} attributionControl={false}>
      <TileLayer attribution={OSM_ATTR.attribution} url={OSM_ATTR.url} />
      <LayersControl position="topright">
        <LayersControl.Overlay checked name="Waypoints">
          <LayerGroup>
            {waypointMarkersPolyline()}
            {waypointMarkers()}
          </LayerGroup>
        </LayersControl.Overlay>
        <LayersControl.Overlay checked name="Points of Interest">
          <LayerGroup>{poiMarkers()}</LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>

      {props.editing && shouldShowWaypointCreationControl(props.activity) && (
        <WaypointCreationControl
          value={waypointCreationType}
          onChange={onWaypointCreationTypeChanged}
        />
      )}

      {/* Remove the attribution prefix */}
      <AttributionControl position="bottomright" prefix="" />

      {/* Map controls and location */}
      <OnMapClick onMapClicked={onMapClicked} />
      {shouldLocateUser && <LocateUser onUserLocationUpdated={onUserLocationUpdated} />}
      {selectedWaypointCoordinate && <CenterMap coordinate={selectedWaypointCoordinate} />}

      {/* Map Annotations */}
      {GPXMapOverlays(props.mapOverlay)}
    </MapContainer>
  );
}
