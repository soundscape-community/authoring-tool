// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import { Download, MapPin, Plus } from 'react-feather';
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

export default function ActivitiesTable(props) {
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
      />
      <div className="col-4 col-xs-1 col-sm-5 col-md-4 col-lg-3 p-0 border-end" id="primary">
        <div className="d-flex flex-column">
          <TableHeader title="My Activities" subheaderView={subheaderView} />
          <ListGroup className="border-bottom" variant="flush">
            {props.activities.length > 0 ? activityRows : <ActivityRowEmpty key="empty-row-activity" />}
          </ListGroup>
        </div>
      </div>
    </>
  );
}
