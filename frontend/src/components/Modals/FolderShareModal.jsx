// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';

import API from '../../api/API';
import { showLoading, dismissLoading } from '../../utils/Toast';
import ErrorAlert from '../Main/ErrorAlert';
import UserPicker from '../Forms/UserPicker';

const ACCESS_OPTIONS = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
];

export default function FolderShareModal(props) {
  const [permissions, setPermissions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [error, setError] = useState(null);

  // Add user permission state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAccess, setUserAccess] = useState('read');

  // Add team permission state
  const [teamIdInput, setTeamIdInput] = useState('');
  const [teamAccess, setTeamAccess] = useState('read');

  // Manage teams state
  const [newTeamName, setNewTeamName] = useState('');
  const [membershipTeamId, setMembershipTeamId] = useState('');
  const [membershipUser, setMembershipUser] = useState(null);
  const [membershipRole, setMembershipRole] = useState('member');

  const teamsById = useMemo(() => {
    const map = new Map();
    teams.forEach((team) => {
      map.set(team.id, team);
    });
    return map;
  }, [teams]);

  const folderPermissions = useMemo(() => {
    if (!props.folder) {
      return [];
    }
    return permissions.filter((permission) => permission.folder === props.folder.id);
  }, [permissions, props.folder]);

  const resetFormState = useCallback(() => {
    setSelectedUser(null);
    setUserAccess('read');
    setTeamIdInput('');
    setTeamAccess('read');
    setNewTeamName('');
    setMembershipTeamId('');
    setMembershipUser(null);
    setMembershipRole('member');
    setError(null);
  }, []);

  const loadSharingData = useCallback(() => {
    if (!props.folder) {
      return;
    }

    const toastId = showLoading('Loading sharing settings...');

    Promise.all([API.getFolderPermissions(), API.getTeams(), API.getTeamMemberships()])
      .then(([permissionList, teamList, membershipList]) => {
        setPermissions(permissionList || []);
        setTeams(teamList || []);
        setMemberships(membershipList || []);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        dismissLoading(toastId);
      });
  }, [props.folder]);

  useEffect(() => {
    if (props.show) {
      resetFormState();
      setPermissions([]);
      setTeams([]);
      setMemberships([]);
      loadSharingData();
    }
  }, [props.show, props.folder, loadSharingData, resetFormState]);

  const updatePermission = (permission, access) => {
    const payload = {
      id: permission.id,
      folder: permission.folder,
      user: permission.user || null,
      team: permission.team || null,
      access,
    };

    API.updateFolderPermission(payload)
      .then((updated) => {
        setPermissions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      })
      .catch((err) => setError(err));
  };

  const deletePermission = (permission) => {
    if (!window.confirm('Remove this permission?')) {
      return;
    }
    API.deleteFolderPermission(permission.id)
      .then(() => {
        setPermissions((prev) => prev.filter((item) => item.id !== permission.id));
      })
      .catch((err) => setError(err));
  };

  const addUserPermission = () => {
    if (!props.folder) {
      return;
    }

    if (!selectedUser) {
      setError({ message: 'Select a user.' });
      return;
    }

    const payload = {
      folder: props.folder.id,
      user: selectedUser.id,
      access: userAccess,
    };

    API.createFolderPermission(payload)
      .then((created) => {
        setPermissions((prev) => prev.concat(created));
        setSelectedUser(null);
      })
      .catch((err) => setError(err));
  };

  const addTeamPermission = () => {
    if (!props.folder) {
      return;
    }

    if (!teamIdInput) {
      setError({ message: 'Select a team.' });
      return;
    }

    const payload = {
      folder: props.folder.id,
      team: teamIdInput,
      access: teamAccess,
    };

    API.createFolderPermission(payload)
      .then((created) => {
        setPermissions((prev) => prev.concat(created));
      })
      .catch((err) => setError(err));
  };

  const createTeam = () => {
    const name = newTeamName.trim();
    if (!name) {
      setError({ message: 'Team name is required.' });
      return;
    }

    API.createTeam({ name })
      .then((team) => {
        setTeams((prev) => prev.concat(team));
        setNewTeamName('');
      })
      .catch((err) => setError(err));
  };

  const addMembership = () => {
    if (!membershipTeamId || !membershipUser) {
      setError({ message: 'Team and user are required.' });
      return;
    }

    API.createTeamMembership({
      team: membershipTeamId,
      user: membershipUser.id,
      role: membershipRole,
    })
      .then((membership) => {
        setMemberships((prev) => prev.concat(membership));
        setMembershipUser(null);
      })
      .catch((err) => setError(err));
  };

  const removeMembership = (membership) => {
    if (!window.confirm('Remove this member?')) {
      return;
    }
    API.deleteTeamMembership(membership.id)
      .then(() => {
        setMemberships((prev) => prev.filter((item) => item.id !== membership.id));
      })
      .catch((err) => setError(err));
  };

  const membershipTeams = useMemo(() => {
    const grouped = new Map();
    memberships.forEach((membership) => {
      if (!grouped.has(membership.team)) {
        grouped.set(membership.team, []);
      }
      grouped.get(membership.team).push(membership);
    });
    return grouped;
  }, [memberships]);

  /** Display name for a permission row's principal. */
  const principalLabel = (permission) => {
    if (permission.user) {
      return permission.user_detail?.username || permission.user;
    }
    return permission.team_detail?.name || teamsById.get(permission.team)?.name || permission.team;
  };

  const principalType = (permission) => {
    if (permission.user) {
      return 'user';
    }
    if (permission.team) {
      return 'team';
    }
    return 'unknown';
  };

  /** Display name for a membership's user. */
  const memberLabel = (membership) => {
    return membership.user_detail?.username || membership.user;
  };

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
                      <td>{principalLabel(permission)}</td>
                      <td>
                        <span
                          className={`badge ${principalType(permission) === 'user' ? 'bg-info' : 'bg-secondary'}`}
                        >
                          {principalType(permission)}
                        </span>
                      </td>
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
                <Form.Group className="flex-grow-1">
                  <Form.Label>User</Form.Label>
                  <UserPicker
                    id="folder-permission-user-picker"
                    value={selectedUser}
                    onChange={setSelectedUser}
                    placeholder="Search by username..."
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
                <Button variant="primary" onClick={addUserPermission} disabled={!selectedUser}>
                  Add
                </Button>
              </div>
            </div>

            <div className="border-top pt-3">
              <h6>Add team access</h6>
              <div className="d-flex align-items-end gap-2">
                <Form.Group className="flex-grow-1" controlId="folder-permission-team">
                  <Form.Label>Team</Form.Label>
                  <Form.Select value={teamIdInput} onChange={(event) => setTeamIdInput(event.target.value)}>
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group controlId="folder-permission-team-access">
                  <Form.Label>Access</Form.Label>
                  <Form.Select value={teamAccess} onChange={(event) => setTeamAccess(event.target.value)}>
                    {ACCESS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Button variant="primary" onClick={addTeamPermission} disabled={!teamIdInput}>
                  Add
                </Button>
              </div>
            </div>

            <div className="border-top pt-3">
              <h6>Manage teams</h6>
              <div className="d-flex align-items-end gap-2 mb-3">
                <Form.Group className="flex-grow-1" controlId="folder-team-create">
                  <Form.Label>New team name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newTeamName}
                    onChange={(event) => setNewTeamName(event.target.value)}
                  />
                </Form.Group>
                <Button variant="outline-primary" onClick={createTeam}>
                  Create team
                </Button>
              </div>

              <div className="d-flex align-items-end gap-2 mb-3">
                <Form.Group className="flex-grow-1" controlId="folder-team-membership-team">
                  <Form.Label>Team</Form.Label>
                  <Form.Select
                    value={membershipTeamId}
                    onChange={(event) => setMembershipTeamId(event.target.value)}
                  >
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="flex-grow-1">
                  <Form.Label>User</Form.Label>
                  <UserPicker
                    id="folder-membership-user-picker"
                    value={membershipUser}
                    onChange={setMembershipUser}
                    placeholder="Search by username..."
                  />
                </Form.Group>
                <Form.Group controlId="folder-team-membership-role">
                  <Form.Label>Role</Form.Label>
                  <Form.Select value={membershipRole} onChange={(event) => setMembershipRole(event.target.value)}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
                <Button variant="outline-primary" onClick={addMembership} disabled={!membershipTeamId || !membershipUser}>
                  Add member
                </Button>
              </div>

              {teams.length > 0 && (
                <Table responsive size="sm">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => (
                      <tr key={`team-${team.id}`}>
                        <td>{team.name}</td>
                        <td>
                          {(membershipTeams.get(team.id) || []).length === 0 ? (
                            <span className="text-muted">No members yet.</span>
                          ) : (
                            (membershipTeams.get(team.id) || []).map((membership) => (
                              <div key={membership.id} className="d-flex align-items-center gap-2 mb-1">
                                <span>{memberLabel(membership)}</span>
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
