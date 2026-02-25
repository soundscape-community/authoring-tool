// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React, { useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import ErrorAlert from '../Main/ErrorAlert';
import { buildFolderOptions } from '../../utils/folderOptions';

export default function FolderCreateModal(props) {
  const [name, setName] = useState('');
  const [parent, setParent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setName('');
    setParent(props.parent || null);
    setError(null);
  }, [props.parent, props.show]);

  const folderOptions = useMemo(() => buildFolderOptions(props.folders), [props.folders]);

  const createFolder = (event) => {
    event?.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError({ message: 'Folder name is required.' });
      return;
    }

    setError(null);
    props.onSubmit({
      name: trimmedName,
      parent: parent || null,
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
        <Modal.Title>Create Folder</Modal.Title>
      </Modal.Header>
      <Form onSubmit={createFolder}>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="folder-create-name">
            <Form.Label>Folder name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="folder-create-parent">
            <Form.Label>Parent folder</Form.Label>
            <Form.Select
              value={parent || ''}
              onChange={(event) => setParent(event.target.value || null)}
            >
              <option value="">/</option>
              {folderOptions.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {`${'-- '.repeat(folder.depth)}${folder.label}`}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {error && <ErrorAlert error={error} />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Create
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
