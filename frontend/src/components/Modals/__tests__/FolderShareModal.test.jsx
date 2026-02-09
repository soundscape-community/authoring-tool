// Copyright (c) Soundscape Community Contributors.
import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const apiMock = vi.hoisted(() => ({
  getFolderPermissions: vi.fn(() => Promise.resolve([])),
  getGroups: vi.fn(() => Promise.resolve([])),
  getGroupMemberships: vi.fn(() => Promise.resolve([])),
  createFolderPermission: vi.fn(() => Promise.resolve({})),
  updateFolderPermission: vi.fn(() => Promise.resolve({})),
  deleteFolderPermission: vi.fn(() => Promise.resolve()),
  createGroup: vi.fn(() => Promise.resolve({})),
  createGroupMembership: vi.fn(() => Promise.resolve({})),
  deleteGroupMembership: vi.fn(() => Promise.resolve()),
  searchUsers: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../api/API', () => ({
  default: apiMock,
}));

vi.mock('../../../utils/Toast', () => ({
  showLoading: vi.fn(() => 'toast-id'),
  dismissLoading: vi.fn(),
  errorContent: (error) => error?.message || 'Error',
}));

import FolderShareModal from '../FolderShareModal';

describe('FolderShareModal', () => {
  it('disables Add button when no user is selected', async () => {
    render(
      <FolderShareModal
        show={true}
        folder={{ id: 'folder-1', name: 'Shared Folder' }}
        onCancel={() => {}}
      />,
    );

    await waitFor(() => expect(apiMock.getFolderPermissions).toHaveBeenCalled());

    const userSection = screen.getByText('Add user access').parentElement;
    const addButton = within(userSection).getByRole('button', { name: 'Add' });

    expect(addButton).toBeDisabled();
  });

  it('loads sharing data when opened', async () => {
    render(
      <FolderShareModal
        show={true}
        folder={{ id: 'folder-1', name: 'Shared Folder' }}
        onCancel={() => {}}
      />,
    );

    await waitFor(() => {
      expect(apiMock.getFolderPermissions).toHaveBeenCalled();
      expect(apiMock.getGroups).toHaveBeenCalled();
      expect(apiMock.getGroupMemberships).toHaveBeenCalled();
    });

    expect(screen.getByText('Permissions for Shared Folder')).toBeInTheDocument();
    expect(screen.getByText('No permissions set yet.')).toBeInTheDocument();
  });

  it('shows user picker instead of text input for user access', async () => {
    render(
      <FolderShareModal
        show={true}
        folder={{ id: 'folder-1', name: 'Shared Folder' }}
        onCancel={() => {}}
      />,
    );

    await waitFor(() => expect(apiMock.getFolderPermissions).toHaveBeenCalled());

    // Should have search-style inputs for user pickers, not plain text "User ID" fields
    const userPickers = screen.getAllByPlaceholderText('Search by username...');
    expect(userPickers.length).toBe(2); // one for permissions, one for memberships
  });
});
