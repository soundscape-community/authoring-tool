// Copyright (c) Soundscape Community Contributors.
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FolderDeleteModal from '../FolderDeleteModal';

describe('FolderDeleteModal', () => {
  it('passes moveActivities state to onDelete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn(() => Promise.resolve());

    render(
      <FolderDeleteModal
        show={true}
        folder={{ id: 'folder-1', name: 'Old Folder' }}
        onCancel={() => {}}
        onDelete={onDelete}
      />,
    );

    const checkbox = screen.getByLabelText('Move activities to /');
    expect(checkbox).toBeChecked();

    await act(async () => {
      await user.click(checkbox);
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Delete' }));
    });

    expect(onDelete).toHaveBeenCalledWith({ moveActivities: false });
  });
});
