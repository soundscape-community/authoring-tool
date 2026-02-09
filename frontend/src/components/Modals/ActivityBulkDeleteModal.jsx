// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import ErrorAlert from '../Main/ErrorAlert';

export default function ActivityBulkDeleteModal(props) {
  const [error, setError] = useState(null);

  useEffect(() => {
    if (props.show) {
      setError(null);
    }
  }, [props.show]);

  const confirmDelete = () => {
    Promise.resolve(props.onDelete())
      .then(() => {
        setError(null);
      })
      .catch((error) => {
        setError(error);
      });
  };

  return (
    <Modal
      show={props.show}
      onHide={props.onCancel}
      backdrop="static"
      centered
      aria-labelledby="contained-modal-title-vcenter"
    >
      <Modal.Header closeButton>
        <Modal.Title>Delete Activities</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="alert alert-danger">
          <strong>Warning:</strong> This will permanently delete {props.count} activities.
        </div>
        <p className="mb-3">This action cannot be undone.</p>
        {error && <ErrorAlert error={error} />}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={confirmDelete}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
