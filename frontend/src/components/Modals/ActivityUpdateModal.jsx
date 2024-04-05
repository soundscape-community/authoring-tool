// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';

import { showLoading, dismissLoading } from '../../utils/Toast';

import ActivityForm from '../Forms/ActivityForm';
import API from '../../api/API';
import ErrorAlert from '../Main/ErrorAlert';

export default function ActivityUpdateModal(props) {
  const [error, setError] = useState(null);

  function createActivity(activity) {
    const toastId = showLoading('Creating activity...');

    return new Promise((resolve, reject) => {
      API.createActivity(activity)
        .then((activity) => {
          dismissLoading(toastId);
          props.onDone(activity);
          resolve();
        })
        .catch((error) => {
          dismissLoading(toastId);
          setError(error);
          reject();
        });
    });
  }

  function updateActivity(activity) {
    const toastId = showLoading('Updating activity...');

    return new Promise((resolve, reject) => {
      API.updateActivity(activity)
        .then((activity) => {
          dismissLoading(toastId);
          props.onDone(activity);
          resolve();
        })
        .catch((error) => {
          dismissLoading(toastId);
          setError(error);
          reject();
        });
    });
  }

  return (
    <Modal
      show={props.show}
      onHide={props.onCancel}
      backdrop="static"
      centered
      aria-labelledby="contained-modal-title-vcenter"
    >
      <Modal.Header closeButton>
        <Modal.Title>{props.creating ? 'Create Activity' : 'Edit Activity'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ActivityForm
          activity={props.activity}
          onSubmit={props.creating ? createActivity : updateActivity}
        />
        {error && <ErrorAlert error={error} />}
      </Modal.Body>
    </Modal>
  );
}
