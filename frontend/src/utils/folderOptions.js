// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import { buildFolderIndex } from './folderIndex';

export function buildFolderOptions(folders) {
  const { byParent: foldersByParent } = buildFolderIndex(folders);
  foldersByParent.forEach((items) => {
    items.sort((a, b) => a.name.localeCompare(b.name));
  });

  const results = [];
  const visited = new Set();

  const collect = (parentId, depth) => {
    const children = foldersByParent.get(parentId) || [];
    children.forEach((folder) => {
      if (visited.has(folder.id)) {
        return;
      }
      visited.add(folder.id);
      results.push({ id: folder.id, label: folder.name, depth });
      collect(folder.id, depth + 1);
    });
  };

  collect(null, 0);

  return results;
}
