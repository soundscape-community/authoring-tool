// Copyright (c) Soundscape Community Contributors.

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Activity from '../../../data/Activity';
import ActivityTable from '../ActivityTable';

function buildActivity(waypoints = []) {
  return new Activity({
    id: 'activity-1',
    name: 'Route',
    description: 'Route description',
    author_name: 'Author',
    type: Activity.TYPE.ORIENTEERING,
    expires: false,
    waypoints_group: {
      id: 'waypoints-group-1',
      waypoints,
    },
    pois_group: {
      id: 'pois-group-1',
      waypoints: [],
    },
  });
}

function buildWaypoint(id, index) {
  return {
    id,
    type: 'ordered',
    index,
    name: `Waypoint ${index + 1}`,
    latitude: '1.000000',
    longitude: '2.000000',
  };
}

function renderActivityTable(overrides = {}) {
  const props = {
    activity: buildActivity(),
    editing: false,
    onActivityUpdate: vi.fn(),
    onWaypointCreate: vi.fn(),
    onWaypointSelected: vi.fn(),
    onWaypointDelete: vi.fn(),
    onWaypointUpdate: vi.fn(),
    onWaypointMovedUp: vi.fn(),
    onWaypointMovedDown: vi.fn(),
    onWaypointsReversed: vi.fn(),
    ...overrides,
  };

  render(<ActivityTable {...props} />);
  return props;
}

describe('ActivityTable', () => {
  it('hides the reverse waypoints button outside editing mode', () => {
    renderActivityTable({
      activity: buildActivity([buildWaypoint('waypoint-1', 0), buildWaypoint('waypoint-2', 1)]),
      editing: false,
    });

    expect(screen.queryByRole('button', { name: 'Reverse Waypoints' })).not.toBeInTheDocument();
  });

  it('disables the reverse waypoints button with fewer than two waypoints', () => {
    renderActivityTable({
      activity: buildActivity([buildWaypoint('waypoint-1', 0)]),
      editing: true,
    });

    expect(screen.getByRole('button', { name: 'Reverse Waypoints' })).toBeDisabled();
  });

  it('calls the reverse callback when the enabled reverse waypoints button is clicked', async () => {
    const user = userEvent.setup();
    const onWaypointsReversed = vi.fn();

    renderActivityTable({
      activity: buildActivity([buildWaypoint('waypoint-1', 0), buildWaypoint('waypoint-2', 1)]),
      editing: true,
      onWaypointsReversed,
    });

    await user.click(screen.getByRole('button', { name: 'Reverse Waypoints' }));

    expect(onWaypointsReversed).toHaveBeenCalledOnce();
  });
});
