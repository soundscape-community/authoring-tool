// Copyright (c) Soundscape Community Contributors.

import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

import Activity from '../../../data/Activity';
import MapView from '../MapView';

const tileLayerMock = vi.fn();

vi.mock('../WaypointMarker', () => ({
  default: () => null,
}));

vi.mock('../POIMarker', () => ({
  default: () => null,
}));

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
  const TileLayer = (props) => {
    tileLayerMock(props);
    return <div data-testid="tile-layer" />;
  };
  const LayersControl = ({ children }) => <div>{children}</div>;
  LayersControl.Overlay = ({ children }) => <div>{children}</div>;

  return {
    MapContainer,
    TileLayer,
    Polyline: () => null,
    useMapEvent: vi.fn(),
    useMap: () => ({
      fitBounds: vi.fn(),
      getContainer: () => ({ style: {} }),
      locate: vi.fn(),
      setView: vi.fn(),
      stopLocate: vi.fn(),
    }),
    Popup: ({ children }) => <div>{children}</div>,
    LayersControl,
    AttributionControl: () => null,
    LayerGroup: ({ children }) => <div>{children}</div>,
  };
});

describe('MapView', () => {
  it('configures OSM tiles to send a cross-origin referrer', () => {
    const activity = new Activity({
      type: Activity.TYPE.GUIDED_TOUR,
      waypoints_group: { id: 'waypoints', waypoints: [] },
      pois_group: { id: 'pois', waypoints: [] },
    });

    render(
      <MapView
        activity={activity}
        selectedWaypoint={null}
        editing={false}
        mapOverlay={null}
        onWaypointCreated={() => {}}
        onWaypointUpdated={() => {}}
      />,
    );

    expect(tileLayerMock).toHaveBeenCalled();
    const [tileLayerProps] = tileLayerMock.mock.calls.at(-1);
    expect(tileLayerProps.referrerPolicy).toBe('strict-origin-when-cross-origin');
  });
});
