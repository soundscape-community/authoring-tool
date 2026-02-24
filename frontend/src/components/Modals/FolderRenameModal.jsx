// Copyright (c) Soundscape Community Contributors.
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.folder) {
      setName(props.folder.name || '');
    } else {
      setName('');
    }
    setError(null);
    if (!props.show) {
      setLoading(false);
    }
  }, [props.folder, props.show]);

  const renameFolder = (event) => {
    event?.preventDefault();

    if (loading) {
      return;
    }

    if (!props.folder) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError({ message: 'Folder name is required.' });
      return;
    }

    const toastId = showLoading('Renaming folder...');
    setLoading(true);

    API.updateFolder({
      id: props.folder.id,
      name: trimmedName,
      parent: props.folder.parent || null,
    })
      .then((folder) => {
        props.onRename(folder);
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        dismissLoading(toastId);
        setLoading(false);
      });
  };

  return (
    <Modal
      show={props.show}
      onHide={loading ? undefined : props.onCancel}
      backdrop="static"
      centered
      aria-labelledby="contained-modal-title-vcenter"
    >
      <Modal.Header closeButton={!loading}>
        <Modal.Title>Rename Folder</Modal.Title>
      </Modal.Header>
      <Form onSubmit={renameFolder}>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="folder-rename-name">
            <Form.Label>Folder name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
              autoFocus
            />
          </Form.Group>
          {error && <ErrorAlert error={error} />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={props.onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={renameFolder} disabled={loading}>
            Rename
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
