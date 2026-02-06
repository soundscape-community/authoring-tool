// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import { FolderPlus, Folder as FolderIcon, Inbox } from 'react-feather';

function FolderRow({ active, label, onClick, icon }) {
  return (
    <ListGroup.Item
      action
      active={active}
      onClick={onClick}
      role="treeitem"
      aria-selected={active}
      className="d-flex align-items-center"
    >
      <span className="me-2">{icon}</span>
      {label}
    </ListGroup.Item>
  );
}

export default function FoldersPanel({ folders, selectedFolderId, onFolderSelect, onFolderCreate }) {
  const folderRows = folders.map((folder) => (
    <FolderRow
      key={folder.id}
      label={folder.name}
      icon={<FolderIcon size={16} aria-hidden="true" />}
      active={selectedFolderId === folder.id}
      onClick={() => onFolderSelect(folder.id)}
    />
  ));

  return (
    <div className="col-3 col-xs-1 col-sm-4 col-md-3 col-lg-3 p-0 border-end" id="folders">
      <div className="d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
          <h2 className="h6 mb-0">Folders</h2>
          <Button variant="outline-primary" size="sm" onClick={onFolderCreate} aria-label="Create folder">
            <FolderPlus size={16} aria-hidden="true" />
          </Button>
        </div>
        <ListGroup variant="flush" role="tree" aria-label="Folder list">
          <FolderRow
            label="All activities"
            icon={<Inbox size={16} aria-hidden="true" />}
            active={selectedFolderId === null}
            onClick={() => onFolderSelect(null)}
          />
          <FolderRow
            label="Unfoldered"
            icon={<Inbox size={16} aria-hidden="true" />}
            active={selectedFolderId === 'none'}
            onClick={() => onFolderSelect('none')}
          />
          {folderRows}
        </ListGroup>
      </div>
    </div>
  );
}
