// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import Row from 'react-bootstrap/Row';

import ActivityDetailHeader from './ActivityDetailHeader';
import EmptyActivity from './ActivityEmpty';
import MapView from './MapView';

export default function ActivityDetail(props) {
    return (
      <div className="col-7 col-xs-1 col-sm-6 col-md-8 col-lg-9 d-flex flex-column h-100" id="secondary">
        {props.activity ? (
          <>
            <ActivityDetailHeader 
              activity={props.activity}
              editing={props.editing}
              mapOverlay={props.mapOverlay}
              onToggleEditing={props.onToggleEditing}
              onActivityDelete={props.onActivityDelete}
              onActivityDuplicate={props.onActivityDuplicate}
              onActivityPublish={props.onActivityPublish}
              onActivityLink={props.onActivityLink}
              onMapOverlay={props.onMapOverlay}
            />
            <Row className="flex-grow-1">
              <MapView
                activity={props.activity}
                selectedWaypoint={props.selectedWaypoint}
                editing={props.editing}
                mapOverlay={props.mapOverlay}
                onWaypointCreated={props.onWaypointCreated}
                onWaypointUpdated={props.onWaypointUpdated}
              />
            </Row>
          </>
        ) : (
          <EmptyActivity />
        )}
      </div>
    );
  }