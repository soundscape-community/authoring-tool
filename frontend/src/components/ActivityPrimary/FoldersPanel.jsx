// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import { ChevronDown, ChevronRight, Edit2, FolderPlus, Folder as FolderIcon, Inbox, Trash2, Users } from 'react-feather';

function FolderRow({
  active,
  label,
  onClick,
  icon,
  level = 0,
  hasChildren = false,
  isExpanded = false,
  onToggle,
  onKeyDown,
  rowId,
  tabIndex = 0,
  setRowRef,
}) {
  const handleToggle = (event) => {
    event.stopPropagation();
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <ListGroup.Item
      as="div"
      action
      active={active}
      onClick={onClick}
      role="treeitem"
      aria-selected={active}
      aria-level={level + 1}
      aria-expanded={hasChildren ? isExpanded : undefined}
      className="d-flex align-items-center"
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      ref={setRowRef}
      data-row-id={rowId}
    >
      <div className="d-flex align-items-center w-100" style={{ paddingLeft: `${level * 16}px` }}>
        {hasChildren ? (
          <button
            type="button"
            className="btn btn-sm btn-link p-0 me-2 folder-toggle"
            onClick={handleToggle}
            aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
          </button>
        ) : (
          <span className="folder-toggle-placeholder me-2" aria-hidden="true" />
        )}
        <span className="me-2">{icon}</span>
        <span className="flex-grow-1">{label}</span>
      </div>
    </ListGroup.Item>
  );
}

export default function FoldersPanel({
  folders,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  onFolderShare,
}) {
  const canModifySelectedFolder = selectedFolderId && selectedFolderId !== 'none';
  const foldersById = React.useMemo(() => {
    const map = new Map();
    folders.forEach((folder) => map.set(folder.id, folder));
    return map;
  }, [folders]);

  const foldersByParent = React.useMemo(() => {
    const map = new Map();
    folders.forEach((folder) => {
      const parentId = folder.parent || null;
      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId).push(folder);
    });
    map.forEach((value) => value.sort((a, b) => a.name.localeCompare(b.name)));
    return map;
  }, [folders]);

  const [expandedIds, setExpandedIds] = React.useState(() => new Set());

  const ancestorIds = React.useMemo(() => {
    if (!selectedFolderId || selectedFolderId === 'none') {
      return [];
    }
    const ids = [];
    let current = foldersById.get(selectedFolderId);
    while (current && current.parent) {
      ids.push(current.parent);
      current = foldersById.get(current.parent);
    }
    return ids;
  }, [foldersById, selectedFolderId]);

  React.useEffect(() => {
    if (ancestorIds.length === 0) {
      return;
    }
    setExpandedIds((prev) => {
      const next = new Set(prev);
      ancestorIds.forEach((id) => next.add(id));
      return next;
    });
  }, [ancestorIds]);

  const toggleExpanded = (folderId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const [focusedRowId, setFocusedRowId] = React.useState('all');
  const rowRefs = React.useRef(new Map());

  const renderFolderRows = (parentId, level) => {
    const children = foldersByParent.get(parentId) || [];
    const rows = [];

    children.forEach((folder) => {
      const hasChildren = (foldersByParent.get(folder.id) || []).length > 0;
      const isExpanded = expandedIds.has(folder.id);
      rows.push(
        <FolderRow
          key={`folder-${folder.id}`}
          rowId={folder.id}
          label={folder.name}
          icon={<FolderIcon size={16} aria-hidden="true" />}
          active={selectedFolderId === folder.id}
          onClick={() => onFolderSelect(folder.id)}
          level={level}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggle={hasChildren ? () => toggleExpanded(folder.id) : undefined}
          tabIndex={focusedRowId === folder.id ? 0 : -1}
          onKeyDown={(event) => handleRowKeyDown(event, folder.id)}
          setRowRef={(node) => {
            if (node) {
              rowRefs.current.set(folder.id, node);
            } else {
              rowRefs.current.delete(folder.id);
            }
          }}
        />,
      );

      if (hasChildren && isExpanded) {
        rows.push(...renderFolderRows(folder.id, level + 1));
      }
    });

    return rows;
  };

  const orderedRowIds = React.useMemo(() => {
    const ids = ['all', 'none'];
    const collectIds = (parentId) => {
      const children = foldersByParent.get(parentId) || [];
      children.forEach((folder) => {
        ids.push(folder.id);
        if (expandedIds.has(folder.id)) {
          collectIds(folder.id);
        }
      });
    };
    collectIds(null);
    return ids;
  }, [foldersByParent, expandedIds]);

  const focusRow = (rowId) => {
    setFocusedRowId(rowId);
    const node = rowRefs.current.get(rowId);
    if (node && typeof node.focus === 'function') {
      node.focus();
    }
  };

  const handleRowKeyDown = (event, rowId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (rowId === 'all') {
        onFolderSelect(null);
      } else if (rowId === 'none') {
        onFolderSelect('none');
      } else {
        onFolderSelect(rowId);
      }
      return;
    }

    const currentIndex = orderedRowIds.indexOf(rowId);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextId = orderedRowIds[Math.min(currentIndex + 1, orderedRowIds.length - 1)];
      if (nextId) {
        focusRow(nextId);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevId = orderedRowIds[Math.max(currentIndex - 1, 0)];
      if (prevId) {
        focusRow(prevId);
      }
    } else if (event.key === 'ArrowRight') {
      if (rowId !== 'all' && rowId !== 'none') {
        const hasChildren = (foldersByParent.get(rowId) || []).length > 0;
        if (hasChildren && !expandedIds.has(rowId)) {
          event.preventDefault();
          toggleExpanded(rowId);
        }
      }
    } else if (event.key === 'ArrowLeft') {
      if (rowId !== 'all' && rowId !== 'none') {
        const hasChildren = (foldersByParent.get(rowId) || []).length > 0;
        if (hasChildren && expandedIds.has(rowId)) {
          event.preventDefault();
          toggleExpanded(rowId);
        }
      }
    }
  };

  React.useEffect(() => {
    if (selectedFolderId && selectedFolderId !== 'none') {
      setFocusedRowId(selectedFolderId);
    } else if (selectedFolderId === 'none') {
      setFocusedRowId('none');
    } else {
      setFocusedRowId('all');
    }
  }, [selectedFolderId]);

  return (
    <div className="col-3 col-xs-1 col-sm-4 col-md-3 col-lg-3 p-0 border-end" id="folders">
      <div className="d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
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
        <ListGroup variant="flush" role="tree" aria-label="Folder list">
          <FolderRow
            rowId="all"
            label="All activities"
            icon={<Inbox size={16} aria-hidden="true" />}
            active={selectedFolderId === null}
            onClick={() => onFolderSelect(null)}
            tabIndex={focusedRowId === 'all' ? 0 : -1}
            onKeyDown={(event) => handleRowKeyDown(event, 'all')}
            setRowRef={(node) => {
              if (node) {
                rowRefs.current.set('all', node);
              } else {
                rowRefs.current.delete('all');
              }
            }}
          />
          <FolderRow
            rowId="none"
            label="Unfoldered"
            icon={<Inbox size={16} aria-hidden="true" />}
            active={selectedFolderId === 'none'}
            onClick={() => onFolderSelect('none')}
            tabIndex={focusedRowId === 'none' ? 0 : -1}
            onKeyDown={(event) => handleRowKeyDown(event, 'none')}
            setRowRef={(node) => {
              if (node) {
                rowRefs.current.set('none', node);
              } else {
                rowRefs.current.delete('none');
              }
            }}
          />
          {renderFolderRows(null, 0)}
        </ListGroup>
      </div>
    </div>
  );
}
