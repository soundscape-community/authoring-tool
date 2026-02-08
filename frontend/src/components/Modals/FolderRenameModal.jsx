// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import API from '../../api/API';
import { showLoading, dismissLoading } from '../../utils/Toast';
import ErrorAlert from '../Main/ErrorAlert';

export default function FolderRenameModal(props) {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (props.folder) {
      setName(props.folder.name || '');
    }
  }, [props.folder]);

  const renameFolder = () => {
    if (!props.folder) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError({ message: 'Folder name is required.' });
      return;
    }

    const toastId = showLoading('Renaming folder...');

    API.updateFolder({
      id: props.folder.id,
      name: trimmedName,
      parent: props.folder.parent || null,
    })
      .then((folder) => {
        dismissLoading(toastId);
        props.onRename(folder);
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
        <Modal.Title>Rename Folder</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3" controlId="folder-rename-name">
          <Form.Label>Folder name</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </Form.Group>
        {error && <ErrorAlert error={error} />}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={renameFolder}>
          Rename
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
