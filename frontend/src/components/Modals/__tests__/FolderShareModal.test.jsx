// Copyright (c) Soundscape Community Contributers.
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
  it('validates missing user id when adding user access', async () => {
    const user = userEvent.setup();

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

    await act(async () => {
      await user.click(addButton);
    });

    expect(screen.getByText('User ID is required.')).toBeInTheDocument();
  });
});
