import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import API from '../../api/API';
import { showLoading, dismissLoading } from '../../utils/Toast';
import ErrorAlert from '../Main/ErrorAlert';

export default function ActivityDeleteModal(props) {
  const [error, setError] = useState(null);

  const deleteActivity = () => {
    const toastId = showLoading('Deleting activity...');

    API.deleteActivity(props.activity.id)
      .then(() => {
        dismissLoading(toastId);
        props.onDelete(props.activity);
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
      aria-labelledby="contained-modal-title-vcenter"
    >
      <Modal.Header closeButton>
        <Modal.Title>Delete Activity</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {`Are you sure you want to delete the activity named "${props.activity?.name}"?`}
        {error && <ErrorAlert error={error} />}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={deleteActivity}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
