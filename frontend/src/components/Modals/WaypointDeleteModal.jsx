// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import API from '../../api/API';
import { showLoading, dismissLoading } from '../../utils/Toast';
import ErrorAlert from '../Main/ErrorAlert';

export default function WaypointDeleteModal(props) {
  const [error, setError] = useState(null);

  const deleteWaypoint = () => {
    const toastId = showLoading(`Deleting ${props.waypoint.typeTitle}...`);

    API.deleteWaypoint(props.waypoint.id)
      .then(() => {
        dismissLoading(toastId);
        props.onDelete(props.waypoint);
      })
      .catch((error) => {
        dismissLoading(toastId);
        setError(error);
      });
  };

  return (
    <Modal
      show={props.show}
      onHide={props.onCancel}
      backdrop="static"
      centered
      aria-labelledby="contained-modal-title-vcenter">
      <Modal.Header closeButton>
        <Modal.Title>{`Delete ${props.waypoint?.typeTitle}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {`Are you sure you want to delete the ${props.waypoint?.typeTitle.toLocaleLowerCase()} named "${
          props.waypoint?.name
        }"?`}
        {error && <ErrorAlert error={error} />}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={deleteWaypoint}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
