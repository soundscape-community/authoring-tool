// Copyright (c) Soundscape Community Contributers.
// Licensed under the MIT License.

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import ErrorAlert from '../Main/ErrorAlert';

export default function FolderDeleteModal(props) {
  const [moveActivities, setMoveActivities] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (props.show) {
      setMoveActivities(true);
      setError(null);
    }
  }, [props.show, props.folder]);

  const confirmDelete = () => {
    if (!props.folder) {
      return;
    }

    Promise.resolve(props.onDelete({ moveActivities }))
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
        <Modal.Title>Delete Folder</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{`Are you sure you want to delete the folder named "${props.folder?.name}"?`}</p>
        <p className="text-muted mb-3">This will delete any subfolders. Activities can be moved to /.</p>
        <Form.Check
          type="checkbox"
          id="folder-delete-move-activities"
          label="Move activities to /"
          checked={moveActivities}
          onChange={(event) => setMoveActivities(event.target.checked)}
        />
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
