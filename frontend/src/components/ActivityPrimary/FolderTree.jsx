// Copyright (c) Soundscape Community Contributers.
// Licensed under the MIT License.

import React from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import { ChevronDown, ChevronRight, Folder as FolderIcon, Inbox } from 'react-feather';

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
      <div className="d-flex align-items-center w-100" style={{ paddingLeft: `${level * 20}px` }}>
        {hasChildren ? (
          <button
            type="button"
            className="btn btn-sm btn-link p-0 me-2 folder-toggle"
            onClick={handleToggle}
            aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
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

export default function FolderTree({
  folders,
  selectedFolderId,
  onFolderSelect,
  ariaLabel = 'Folder list',
  className,
  variant = 'flush',
}) {
  const foldersById = React.useMemo(() => {
    const map = new Map();
    (folders || []).forEach((folder) => map.set(folder.id, folder));
    return map;
  }, [folders]);

  const foldersByParent = React.useMemo(() => {
    const map = new Map();
    (folders || []).forEach((folder) => {
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
    if (!selectedFolderId) {
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

  const [rootExpanded, setRootExpanded] = React.useState(true);
  const [focusedRowId, setFocusedRowId] = React.useState('root');
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
    const ids = ['root'];
    const collectIds = (parentId) => {
      const children = foldersByParent.get(parentId) || [];
      children.forEach((folder) => {
        ids.push(folder.id);
        if (expandedIds.has(folder.id)) {
          collectIds(folder.id);
        }
      });
    };
    if (rootExpanded) {
      collectIds(null);
    }
    return ids;
  }, [expandedIds, foldersByParent, rootExpanded]);

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
      if (rowId === 'root') {
        onFolderSelect(null);
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
      if (rowId === 'root') {
        if (!rootExpanded && (foldersByParent.get(null) || []).length > 0) {
          event.preventDefault();
          setRootExpanded(true);
        }
      } else {
        const hasChildren = (foldersByParent.get(rowId) || []).length > 0;
        if (hasChildren && !expandedIds.has(rowId)) {
          event.preventDefault();
          toggleExpanded(rowId);
        }
      }
    } else if (event.key === 'ArrowLeft') {
      if (rowId === 'root') {
        if (rootExpanded) {
          event.preventDefault();
          setRootExpanded(false);
        }
      } else {
        const hasChildren = (foldersByParent.get(rowId) || []).length > 0;
        if (hasChildren && expandedIds.has(rowId)) {
          event.preventDefault();
          toggleExpanded(rowId);
        }
      }
    }
  };

  React.useEffect(() => {
    if (selectedFolderId) {
      setFocusedRowId(selectedFolderId);
    } else {
      setFocusedRowId('root');
    }
  }, [selectedFolderId]);

  React.useEffect(() => {
    if (selectedFolderId && !rootExpanded) {
      setRootExpanded(true);
    }
  }, [rootExpanded, selectedFolderId]);

  return (
    <ListGroup variant={variant} role="tree" aria-label={ariaLabel} className={className}>
      <FolderRow
        rowId="root"
        label="/"
        icon={<Inbox size={16} aria-hidden="true" />}
        active={selectedFolderId === null}
        onClick={() => onFolderSelect(null)}
        level={0}
        hasChildren={(foldersByParent.get(null) || []).length > 0}
        isExpanded={rootExpanded}
        onToggle={() => setRootExpanded((prev) => !prev)}
        tabIndex={focusedRowId === 'root' ? 0 : -1}
        onKeyDown={(event) => handleRowKeyDown(event, 'root')}
        setRowRef={(node) => {
          if (node) {
            rowRefs.current.set('root', node);
          } else {
            rowRefs.current.delete('root');
          }
        }}
      />
      {rootExpanded ? renderFolderRows(null, 1) : null}
    </ListGroup>
  );
}
