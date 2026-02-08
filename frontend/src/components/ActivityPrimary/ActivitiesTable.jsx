// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import Button from 'react-bootstrap/Button';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import ListGroup from 'react-bootstrap/ListGroup';
import { Download, Folder as FolderIcon, MapPin, Plus } from 'react-feather';
import TableHeader from '../Table/TableHeader';
import TableRow from '../Table/TableRow';
import TableRowEmpty from '../Table/TableRowEmpty';
import FoldersPanel from './FoldersPanel';

function ActivityRow({ activity, onClick }) {
  return <TableRow title={activity.name} subtitle={activity.description} onClick={onClick.bind(this, activity)} />;
}

function ActivityRowEmpty() {
  const icon = <MapPin size={16} style={{ verticalAlign: 'text-bottom' }} />;
  return (
    <TableRowEmpty title="No Activities" subtitle="Tap the Add button to create your first activity" icon={icon} />
  );
}

function HeaderButtons({ onActivityCreate, onActivityImport }) {
  return (
    <div className="d-flex flex-row">
      <Button className="me-2" variant="primary" onClick={onActivityCreate} size="sm">
        <Plus className="me-1" color="white" size={16} style={{ verticalAlign: 'text-bottom' }} />
        Create
      </Button>
      <Button className="me-2" variant="primary" onClick={onActivityImport} size="sm">
        <Download className="me-1" color="white" size={16} style={{ verticalAlign: 'text-bottom' }} />
        Import
      </Button>
    </div>
  );
}

function buildFolderIndex(folders) {
  const map = new Map();
  (folders || []).forEach((folder) => map.set(folder.id, folder));
  return map;
}

function getFolderPath(foldersById, folderId) {
  const path = [];
  let currentId = folderId;

  while (currentId && foldersById.has(currentId)) {
    const folder = foldersById.get(currentId);
    path.unshift(folder);
    currentId = folder.parent || null;
  }

  return path;
}

function getChildFolders(folders, parentId) {
  if (parentId === 'none') {
    return [];
  }

  const normalizedParentId = parentId || null;
  return (folders || []).filter((folder) => (folder.parent || null) === normalizedParentId);
}

export default function ActivitiesTable(props) {
  const foldersById = React.useMemo(() => buildFolderIndex(props.folders), [props.folders]);
  const selectedFolderId = props.selectedFolderId;

  const folderPath = React.useMemo(() => {
    if (!selectedFolderId || selectedFolderId === 'none') {
      return [];
    }
    return getFolderPath(foldersById, selectedFolderId);
  }, [foldersById, selectedFolderId]);

  const breadcrumbItems = React.useMemo(() => {
    const items = [
      {
        id: null,
        label: 'All activities',
        active: selectedFolderId === null,
      },
    ];

    if (selectedFolderId === 'none') {
      items.push({
        id: 'none',
        label: 'Unfoldered',
        active: true,
      });
      return items;
    }

    folderPath.forEach((folder, index) => {
      items.push({
        id: folder.id,
        label: folder.name,
        active: index === folderPath.length - 1,
      });
    });

    return items;
  }, [folderPath, selectedFolderId]);

  const childFolders = React.useMemo(
    () => getChildFolders(props.folders, selectedFolderId),
    [props.folders, selectedFolderId],
  );

  const activityRows = props.activities.map((activity, index) => (
    <ActivityRow key={activity.id} activity={activity} index={index} onClick={props.onActivitySelected} />
  ));

  const subheaderView = (
    <HeaderButtons onActivityCreate={props.onActivityCreate} onActivityImport={props.onActivityImport} />
  );

  return (
    <>
      <FoldersPanel
        folders={props.folders}
        selectedFolderId={props.selectedFolderId}
        onFolderSelect={props.onFolderSelect}
        onFolderCreate={props.onFolderCreate}
        onFolderRename={props.onFolderRename}
        onFolderDelete={props.onFolderDelete}
        onFolderShare={props.onFolderShare}
      />
      <div className="col-4 col-xs-1 col-sm-5 col-md-4 col-lg-3 p-0 border-end" id="primary">
        <div className="d-flex flex-column">
          <TableHeader title="My Activities" subheaderView={subheaderView} />
          <div className="px-3 py-2 border-bottom folder-breadcrumb">
            <Breadcrumb className="mb-0">
              {breadcrumbItems.map((item) => (
                <Breadcrumb.Item key={`breadcrumb-${item.id ?? 'all'}`} active={item.active}>
                  {item.active ? (
                    item.label
                  ) : (
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={() => props.onFolderSelect(item.id)}
                    >
                      {item.label}
                    </button>
                  )}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </div>
          {childFolders.length > 0 && (
            <div className="border-bottom">
              <div className="px-3 py-2 text-uppercase text-muted small">Folders</div>
              <ListGroup variant="flush" aria-label="Folder contents">
                {childFolders.map((folder) => (
                  <ListGroup.Item
                    key={`child-folder-${folder.id}`}
                    action
                    onClick={() => props.onFolderSelect(folder.id)}
                  >
                    <div className="d-flex align-items-center">
                      <FolderIcon className="me-2" size={16} aria-hidden="true" />
                      <span>{folder.name}</span>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}
          <ListGroup className="border-bottom" variant="flush">
            {props.activities.length > 0 ? activityRows : <ActivityRowEmpty key="empty-row-activity" />}
          </ListGroup>
        </div>
      </div>
    </>
  );
}
