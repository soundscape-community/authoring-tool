// Copyright (c) Soundscape Community Contributors.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Activity from '../../../data/Activity';
import MapView from '../MapView';

vi.mock('../../../utils/GPX+MapView', () => ({
  GPXMapOverlaysBounds: vi.fn(() => [[47.64203, -122.141262]]),
  GPXMapOverlays: vi.fn(() => null),
}));

vi.mock('react-leaflet', () => {
  const MapContainer = React.forwardRef(({ children }, ref) => {
    React.useImperativeHandle(ref, () => ({
      fitBounds: vi.fn(),
      getContainer: () => ({ style: {} }),
    }));

    return <div data-testid="map-container">{children}</div>;
  });

  const Marker = ({ children, title }) => {
    // Leaflet marker options are immutable after mount, so this mock keeps the
    // original title until React remounts the Marker.
    const [mountedTitle] = React.useState(title);
    return (
      <div data-testid="leaflet-marker" title={mountedTitle}>
        {children}
      </div>
    );
  };

  const LayersControl = ({ children }) => <div>{children}</div>;
  LayersControl.Overlay = ({ children }) => <div>{children}</div>;

  return {
    MapContainer,
    Marker,
    TileLayer: () => null,
    Polyline: ({ children }) => <div>{children}</div>,
    Tooltip: ({ children, permanent }) => (
      <span data-testid={permanent ? 'waypoint-tooltip' : undefined}>{children}</span>
    ),
    Popup: ({ children }) => <div>{children}</div>,
    useMapEvent: vi.fn(),
    useMap: () => ({
      fitBounds: vi.fn(),
      getContainer: () => ({ style: {} }),
      locate: vi.fn(),
      setView: vi.fn(),
      stopLocate: vi.fn(),
    }),
    LayersControl,
    AttributionControl: () => null,
    LayerGroup: ({ children }) => <div>{children}</div>,
  };
});

function buildActivity({ waypoint, poi } = {}) {
  return new Activity({
    type: Activity.TYPE.ORIENTEERING,
    waypoints_group: {
      id: 'waypoints',
      waypoints: waypoint ? [waypoint] : [],
    },
    pois_group: {
      id: 'pois',
      waypoints: poi ? [poi] : [],
    },
  });
}

function buildWaypoint(overrides = {}) {
  return {
    id: 'waypoint-1',
    type: 'ordered',
    index: 0,
    name: 'point1',
    latitude: '47.642030',
    longitude: '-122.141262',
    ...overrides,
  };
}

function renderMap(activity) {
  return render(
    <MapView
      activity={activity}
      selectedWaypoint={null}
      editing={false}
      mapOverlay={null}
      onWaypointCreated={() => {}}
      onWaypointUpdated={() => {}}
    />,
  );
}

describe('MapView marker metadata', () => {
  it('refreshes ordered marker metadata when an existing waypoint is reordered or renamed', () => {
    const { rerender } = renderMap(buildActivity({ waypoint: buildWaypoint() }));

    expect(screen.getByTestId('waypoint-tooltip')).toHaveTextContent('1');
    expect(screen.getByText('1. point1')).toBeInTheDocument();
    expect(screen.getByTestId('leaflet-marker')).toHaveAttribute('title', '1. point1');

    rerender(
      <MapView
        activity={buildActivity({ waypoint: buildWaypoint({ index: 1, name: 'point2' }) })}
        selectedWaypoint={null}
        editing={false}
        mapOverlay={null}
        onWaypointCreated={() => {}}
        onWaypointUpdated={() => {}}
      />,
    );

    expect(screen.getByTestId('waypoint-tooltip')).toHaveTextContent('2');
    expect(screen.getByText('2. point2')).toBeInTheDocument();
    expect(screen.getByTestId('leaflet-marker')).toHaveAttribute('title', '2. point2');
  });

  it('refreshes POI marker titles when an existing POI is renamed', () => {
    const poi = buildWaypoint({ id: 'poi-1', type: 'unordered', name: 'Museum' });
    const { rerender } = renderMap(buildActivity({ poi }));

    expect(screen.getByTestId('leaflet-marker')).toHaveAttribute('title', 'Museum');

    rerender(
      <MapView
        activity={buildActivity({ poi: buildWaypoint({ id: 'poi-1', type: 'unordered', name: 'Gallery' }) })}
        selectedWaypoint={null}
        editing={false}
        mapOverlay={null}
        onWaypointCreated={() => {}}
        onWaypointUpdated={() => {}}
      />,
    );

    expect(screen.getByTestId('leaflet-marker')).toHaveAttribute('title', 'Gallery');
  });
});
