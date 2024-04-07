// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';

import WaypointForm from '../Forms/WaypointForm';
import API from '../../api/API';
import { showLoading, dismissLoading, showError } from '../../utils/Toast';
import Waypoint from '../../data/Waypoint';
import ErrorAlert from '../Main/ErrorAlert';

export default function WaypointUpdateModal(props) {
  const [error, setError] = useState(null);

  const createWaypoint = (waypoint) => {
    waypoint.group = props.activity.waypointGroupByType(props.waypointType).id;

    const toastId = showLoading(`Creating ${Waypoint.typeTitle(props.waypointType)}...`);

    return new Promise((resolve, reject) => {
      API.createWaypoint(waypoint)
        .then((waypoint) => {
          dismissLoading(toastId);
          props.onDone(waypoint);
          resolve();
        })
        .catch((error) => {
          dismissLoading(toastId);
          showError(error);
          setError(error);
          reject();
        });
    });
  };

  const updateWaypoint = (waypoint) => {
    const toastId = showLoading(`Updating  ${props.waypoint.typeTitle}...`);

    return new Promise((resolve, reject) => {
      API.updateWaypoint(waypoint)
        .then((waypoint) => {
          dismissLoading(toastId);
          props.onDone(waypoint);
          resolve();
        })
        .catch((error) => {
          dismissLoading(toastId);
          setError(error);
          reject();
        });
    });
  };

  const typeTitle = props.waypoint ? props.waypoint.typeTitle : Waypoint.typeTitle(props.waypointType);

  return (
    <Modal
      show={props.show}
      onHide={props.onCancel}
      backdrop="static"
      centered
      aria-labelledby="contained-modal-title-vcenter">
      <Modal.Header closeButton>
        <Modal.Title>
          {props.creating ? 'Add' : 'Edit'} {typeTitle}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <WaypointForm
          waypoint={props.waypoint}
          waypointType={props.waypointType}
          activity={props.activity}
          onSubmit={props.creating ? createWaypoint : updateWaypoint}
        />
        {error && <ErrorAlert error={error} />}
      </Modal.Body>
    </Modal>
  );
}
