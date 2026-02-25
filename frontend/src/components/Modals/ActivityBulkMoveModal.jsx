// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import ErrorAlert from '../Main/ErrorAlert';
import FolderTree from '../ActivityPrimary/FolderTree';

export default function ActivityBulkMoveModal(props) {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (props.show) {
      setSelectedFolderId(null);
      setError(null);
    }
  }, [props.show]);

  const handleMove = () => {
    const target = selectedFolderId || null;
    Promise.resolve(props.onMove(target))
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
        <Modal.Title>Move Activities</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">Move {props.count} selected activities to:</p>
        <Form.Group controlId="bulk-move-folder">
          <Form.Label>Folder</Form.Label>
          <FolderTree
            folders={props.folders}
            selectedFolderId={selectedFolderId}
            onFolderSelect={setSelectedFolderId}
            className="folder-tree folder-tree-modal border rounded"
          />
        </Form.Group>
        {error && <ErrorAlert error={error} />}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleMove}>
          Move
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
