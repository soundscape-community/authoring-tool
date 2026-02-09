// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import Button from 'react-bootstrap/Button';
import { Edit2, FolderPlus, Trash2, Users } from 'react-feather';
import FolderTree from './FolderTree';

export default function FoldersPanel({
  folders,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  onFolderShare,
}) {
  const canModifySelectedFolder = Boolean(selectedFolderId);

  return (
    <div className="col-3 col-xs-1 col-sm-4 col-md-3 col-lg-3 p-0 border-end" id="folders">
      <div className="d-flex flex-column">
        <div className="folder-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
          <h2 className="h6 mb-0">Folders</h2>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={onFolderShare}
              aria-label="Share folder"
              disabled={!canModifySelectedFolder}
            >
              <Users size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onFolderRename}
              aria-label="Rename folder"
              disabled={!canModifySelectedFolder}
            >
              <Edit2 size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={onFolderDelete}
              aria-label="Delete folder"
              disabled={!canModifySelectedFolder}
            >
              <Trash2 size={16} aria-hidden="true" />
            </Button>
            <Button variant="outline-primary" size="sm" onClick={onFolderCreate} aria-label="Create folder">
              <FolderPlus size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
        <FolderTree
          folders={folders}
          selectedFolderId={selectedFolderId}
          onFolderSelect={onFolderSelect}
          className="folder-tree"
        />
      </div>
    </div>
  );
}
