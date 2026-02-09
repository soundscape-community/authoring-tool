// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React from 'react';
import Button from 'react-bootstrap/Button';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import { Download, Folder as FolderIcon, MapPin, Move, Plus, Trash2 } from 'react-feather';
import TableHeader from '../Table/TableHeader';
import TableRow from '../Table/TableRow';
import TableRowEmpty from '../Table/TableRowEmpty';
import FoldersPanel from './FoldersPanel';
import { buildFolderIndex } from '../../utils/folderIndex';

function ActivityRow({ activity, selected, onClick, onToggle }) {
  return (
    <ListGroup.Item
      action
      onClick={onClick}
      className={`py-3 lh-tight activity-row ${selected ? 'activity-row-selected' : ''}`}
    >
      <div className="d-flex align-items-start">
        <Form.Check
          type="checkbox"
          className="me-2 mt-1"
          checked={selected}
          aria-label={`Select ${activity.name}`}
          onClick={(event) => event.stopPropagation()}
          onChange={() => onToggle(activity.id)}
        />
        <div className="flex-grow-1">
          <strong className="mb-1 d-block">{activity.name}</strong>
          <p className="mb-1">{activity.description ? activity.description : '-'}</p>
        </div>
      </div>
    </ListGroup.Item>
  );
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

function BulkToolbar({
  selectionCount,
  allSelected,
  partiallySelected,
  onSelectAll,
  onMove,
  onDelete,
}) {
  const checkboxRef = React.useRef(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected]);

  return (
    <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom activity-toolbar">
      <div className="d-flex align-items-center gap-2">
        <Form.Check
          type="checkbox"
          label="Select all"
          checked={allSelected}
          ref={checkboxRef}
          onChange={onSelectAll}
        />
        <span className="text-muted small">{selectionCount} selected</span>
      </div>
      <div className="d-flex align-items-center gap-2">
        <Button size="sm" variant="outline-primary" onClick={onMove} disabled={selectionCount === 0}>
          <Move size={14} className="me-1" aria-hidden="true" />
          Move to folder
        </Button>
        <Button size="sm" variant="danger" onClick={onDelete} disabled={selectionCount === 0}>
          <Trash2 size={14} className="me-1" aria-hidden="true" />
          Delete
        </Button>
      </div>
    </div>
  );
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
  const normalizedParentId = parentId || null;
  return (folders || []).filter((folder) => (folder.parent || null) === normalizedParentId);
}

export default function ActivitiesTable(props) {
  const foldersById = React.useMemo(() => buildFolderIndex(props.folders).byId, [props.folders]);
  const selectedFolderId = props.selectedFolderId;

  const folderPath = React.useMemo(() => {
    if (!selectedFolderId) {
      return [];
    }
    return getFolderPath(foldersById, selectedFolderId);
  }, [foldersById, selectedFolderId]);

  const breadcrumbItems = React.useMemo(() => {
    const items = [
      {
        id: null,
        label: '/',
        active: selectedFolderId === null,
      },
    ];

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

  const selectedActivityIds = props.selectedActivityIds || [];
  const selectionCount = selectedActivityIds.length;
  const allSelected = props.activities.length > 0 && selectionCount === props.activities.length;
  const partiallySelected = selectionCount > 0 && selectionCount < props.activities.length;

  const activityRows = props.activities.map((activity, index) => (
    <ActivityRow
      key={activity.id}
      activity={activity}
      index={index}
      selected={selectedActivityIds.includes(activity.id)}
      onClick={() => props.onActivitySelected(activity)}
      onToggle={props.onActivityToggle}
    />
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
          <BulkToolbar
            selectionCount={selectionCount}
            allSelected={allSelected}
            partiallySelected={partiallySelected}
            onSelectAll={props.onActivityToggleAll}
            onMove={props.onBulkMove}
            onDelete={props.onBulkDelete}
          />
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
