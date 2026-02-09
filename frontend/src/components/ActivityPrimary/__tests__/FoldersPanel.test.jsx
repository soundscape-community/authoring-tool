// Copyright (c) Soundscape Community Contributers.
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FoldersPanel from '../FoldersPanel';

describe('FoldersPanel', () => {
  const folders = [
    { id: 'root', name: 'Root', parent: null },
    { id: 'child', name: 'Child', parent: 'root' },
  ];

  it('expands and collapses nested folders', async () => {
    const user = userEvent.setup();

    render(
      <FoldersPanel
        folders={folders}
        selectedFolderId={null}
        onFolderSelect={() => {}}
        onFolderCreate={() => {}}
        onFolderRename={() => {}}
        onFolderDelete={() => {}}
        onFolderShare={() => {}}
      />,
    );

    expect(screen.queryByText('Child')).toBeNull();

    await act(async () => {
      await user.click(screen.getByLabelText('Expand Root'));
    });
    expect(await screen.findByText('Child')).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByLabelText('Collapse Root'));
    });
    await waitFor(() => expect(screen.queryByText('Child')).toBeNull());
  });

  it('supports arrow key navigation', async () => {
    const user = userEvent.setup();

    render(
      <FoldersPanel
        folders={folders}
        selectedFolderId={null}
        onFolderSelect={() => {}}
        onFolderCreate={() => {}}
        onFolderRename={() => {}}
        onFolderDelete={() => {}}
        onFolderShare={() => {}}
      />,
    );

    const rootRow = screen.getByRole('treeitem', { name: '/' });
    const rootFolderRow = screen.getByRole('treeitem', { name: 'Root' });

    rootRow.focus();
    await act(async () => {
      await user.keyboard('{ArrowDown}');
    });

    expect(document.activeElement).toBe(rootFolderRow);
  });
});
