// Copyright (c) Soundscape Community Contributors.

/**
 * Build lookup indexes from a flat folder array.
 *
 * @param {Array} folders - Flat array of folder objects with `id` and `parent` properties.
 * @returns {{ byId: Map, byParent: Map }}
 *   `byId`     – Map(folderId → folder)
 *   `byParent` – Map(parentId|null → [folder, …])
 */
export function buildFolderIndex(folders) {
  const byId = new Map();
  const byParent = new Map();

  (folders || []).forEach((folder) => {
    byId.set(folder.id, folder);
    const parentId = folder.parent || null;
    if (!byParent.has(parentId)) {
      byParent.set(parentId, []);
    }
    byParent.get(parentId).push(folder);
  });

  return { byId, byParent };
}

/**
 * Collect all descendant folder IDs starting from `rootId` (BFS).
 *
 * @param {Map} byParent - Map from `buildFolderIndex`.
 * @param {string} rootId
 * @returns {Set<string>}
 */
export function getDescendantIds(byParent, rootId) {
  const ids = new Set();
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || ids.has(currentId)) continue;
    ids.add(currentId);
    const children = byParent.get(currentId) || [];
    children.forEach((folder) => {
      queue.push(folder.id);
    });
  }

  return ids;
}
