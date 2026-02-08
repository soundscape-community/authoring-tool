// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';

import API from '../../api/API';
import { showLoading, dismissLoading } from '../../utils/Toast';
import ErrorAlert from '../Main/ErrorAlert';

const ACCESS_OPTIONS = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
];

export default function FolderShareModal(props) {
  const [permissions, setPermissions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [error, setError] = useState(null);

  const [userIdInput, setUserIdInput] = useState('');
  const [userAccess, setUserAccess] = useState('read');
  const [groupIdInput, setGroupIdInput] = useState('');
  const [groupAccess, setGroupAccess] = useState('read');

  const [newGroupName, setNewGroupName] = useState('');
  const [membershipGroupId, setMembershipGroupId] = useState('');
  const [membershipUserId, setMembershipUserId] = useState('');
  const [membershipRole, setMembershipRole] = useState('member');

  const groupsById = useMemo(() => {
    const map = new Map();
    groups.forEach((group) => map.set(group.id, group));
    return map;
  }, [groups]);

  const folderPermissions = useMemo(() => {
    if (!props.folder) {
      return [];
    }
    return permissions.filter((permission) => permission.folder === props.folder.id);
  }, [permissions, props.folder]);

  const loadSharingData = () => {
    if (!props.folder) {
      return;
    }

    const toastId = showLoading('Loading sharing settings...');

    Promise.all([API.getFolderPermissions(), API.getGroups(), API.getGroupMemberships()])
      .then(([permissionList, groupList, membershipList]) => {
        setPermissions(permissionList || []);
        setGroups(groupList || []);
        setMemberships(membershipList || []);
        if (!groupIdInput && groupList.length > 0) {
          setGroupIdInput(groupList[0].id);
        }
        if (!membershipGroupId && groupList.length > 0) {
          setMembershipGroupId(groupList[0].id);
        }
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        dismissLoading(toastId);
      });
  };

  useEffect(() => {
    if (props.show) {
      setError(null);
      loadSharingData();
    }
  }, [props.show, props.folder]);

  const updatePermission = (permission, access) => {
    const payload = {
      id: permission.id,
      folder: permission.folder,
      principal_type: permission.principal_type,
      user: permission.user || null,
      group: permission.group || null,
      access,
    };

    return API.updateFolderPermission(payload).then((updated) => {
      setPermissions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    });
  };

  const deletePermission = (permission) => {
    return API.deleteFolderPermission(permission.id).then(() => {
      setPermissions((prev) => prev.filter((item) => item.id !== permission.id));
    });
  };

  const addUserPermission = () => {
    if (!props.folder) {
      return;
    }

    const userId = userIdInput.trim();
    if (!userId) {
      setError({ message: 'User ID is required.' });
      return;
    }

    const payload = {
      folder: props.folder.id,
      principal_type: 'user',
      user: userId,
      access: userAccess,
    };

    API.createFolderPermission(payload)
      .then((created) => {
        setPermissions((prev) => prev.concat(created));
        setUserIdInput('');
      })
      .catch((error) => setError(error));
  };

  const addGroupPermission = () => {
    if (!props.folder) {
      return;
    }

    if (!groupIdInput) {
      setError({ message: 'Select a group.' });
      return;
    }

    const payload = {
      folder: props.folder.id,
      principal_type: 'group',
      group: groupIdInput,
      access: groupAccess,
    };

    API.createFolderPermission(payload)
      .then((created) => {
        setPermissions((prev) => prev.concat(created));
      })
      .catch((error) => setError(error));
  };

  const createGroup = () => {
    const name = newGroupName.trim();
    if (!name) {
      setError({ message: 'Group name is required.' });
      return;
    }

    API.createGroup({ name })
      .then((group) => {
        setGroups((prev) => prev.concat(group));
        setNewGroupName('');
        setGroupIdInput(group.id);
        setMembershipGroupId(group.id);
      })
      .catch((error) => setError(error));
  };

  const addMembership = () => {
    if (!membershipGroupId || !membershipUserId.trim()) {
      setError({ message: 'Group and user ID are required.' });
      return;
    }

    API.createGroupMembership({
      group: membershipGroupId,
      user: membershipUserId.trim(),
      role: membershipRole,
    })
      .then((membership) => {
        setMemberships((prev) => prev.concat(membership));
        setMembershipUserId('');
      })
      .catch((error) => setError(error));
  };

  const removeMembership = (membership) => {
    API.deleteGroupMembership(membership.id)
      .then(() => {
        setMemberships((prev) => prev.filter((item) => item.id !== membership.id));
      })
      .catch((error) => setError(error));
  };

  const membershipGroups = useMemo(() => {
    const grouped = new Map();
    memberships.forEach((membership) => {
      if (!grouped.has(membership.group)) {
        grouped.set(membership.group, []);
      }
      grouped.get(membership.group).push(membership);
    });
    return grouped;
  }, [memberships]);

  return (
    <Modal
      show={props.show}
      onHide={props.onCancel}
      backdrop="static"
      centered
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
    >
      <Modal.Header closeButton>
        <Modal.Title>Sharing Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.folder ? (
          <>
            <h5 className="mb-3">Permissions for {props.folder.name}</h5>
            <Table responsive size="sm">
              <thead>
                <tr>
                  <th>Principal</th>
                  <th>Type</th>
                  <th>Access</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {folderPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-muted">
                      No permissions set yet.
                    </td>
                  </tr>
                ) : (
                  folderPermissions.map((permission) => (
                    <tr key={permission.id}>
                      <td>
                        {permission.principal_type === 'user'
                          ? permission.user
                          : groupsById.get(permission.group)?.name || permission.group}
                      </td>
                      <td>{permission.principal_type}</td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={permission.access}
                          onChange={(event) => updatePermission(permission, event.target.value)}
                        >
                          {ACCESS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td className="text-end">
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => deletePermission(permission)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            <div className="border-top pt-3">
              <h6>Add user access</h6>
              <div className="d-flex align-items-end gap-2">
                <Form.Group className="flex-grow-1" controlId="folder-permission-user">
                  <Form.Label>User ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={userIdInput}
                    onChange={(event) => setUserIdInput(event.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="folder-permission-user-access">
                  <Form.Label>Access</Form.Label>
                  <Form.Select value={userAccess} onChange={(event) => setUserAccess(event.target.value)}>
                    {ACCESS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Button variant="primary" onClick={addUserPermission}>
                  Add
                </Button>
              </div>
            </div>

            <div className="border-top pt-3">
              <h6>Add group access</h6>
              <div className="d-flex align-items-end gap-2">
                <Form.Group className="flex-grow-1" controlId="folder-permission-group">
                  <Form.Label>Group</Form.Label>
                  <Form.Select value={groupIdInput} onChange={(event) => setGroupIdInput(event.target.value)}>
                    <option value="">Select a group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group controlId="folder-permission-group-access">
                  <Form.Label>Access</Form.Label>
                  <Form.Select value={groupAccess} onChange={(event) => setGroupAccess(event.target.value)}>
                    {ACCESS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Button variant="primary" onClick={addGroupPermission}>
                  Add
                </Button>
              </div>
            </div>

            <div className="border-top pt-3">
              <h6>Manage groups</h6>
              <div className="d-flex align-items-end gap-2 mb-3">
                <Form.Group className="flex-grow-1" controlId="folder-group-create">
                  <Form.Label>New group name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newGroupName}
                    onChange={(event) => setNewGroupName(event.target.value)}
                  />
                </Form.Group>
                <Button variant="outline-primary" onClick={createGroup}>
                  Create group
                </Button>
              </div>

              <div className="d-flex align-items-end gap-2 mb-3">
                <Form.Group className="flex-grow-1" controlId="folder-group-membership-group">
                  <Form.Label>Group</Form.Label>
                  <Form.Select
                    value={membershipGroupId}
                    onChange={(event) => setMembershipGroupId(event.target.value)}
                  >
                    <option value="">Select a group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="flex-grow-1" controlId="folder-group-membership-user">
                  <Form.Label>User ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={membershipUserId}
                    onChange={(event) => setMembershipUserId(event.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="folder-group-membership-role">
                  <Form.Label>Role</Form.Label>
                  <Form.Select value={membershipRole} onChange={(event) => setMembershipRole(event.target.value)}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
                <Button variant="outline-primary" onClick={addMembership}>
                  Add member
                </Button>
              </div>

              {groups.length > 0 && (
                <Table responsive size="sm">
                  <thead>
                    <tr>
                      <th>Group</th>
                      <th>Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr key={`group-${group.id}`}>
                        <td>{group.name}</td>
                        <td>
                          {(membershipGroups.get(group.id) || []).length === 0 ? (
                            <span className="text-muted">No members yet.</span>
                          ) : (
                            (membershipGroups.get(group.id) || []).map((membership) => (
                              <div key={membership.id} className="d-flex align-items-center gap-2 mb-1">
                                <span>{membership.user}</span>
                                <span className="text-muted">({membership.role})</span>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => removeMembership(membership)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted">Select a folder to manage sharing.</p>
        )}
        {error && <ErrorAlert error={error} />}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onCancel}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
