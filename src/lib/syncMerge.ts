/**
 * Pure functions for Sync Merging, Last-Write-Wins, and Tombstone handling.
 * Easily unit tested without mock databases.
 */

export interface SyncRecordPayload {
  entity: string
  id: string
  data: any
  updated_at: string
  deleted: boolean
}

export interface MergeResult {
  record: any | null
  action: 'apply_remote' | 'keep_local' | 'delete'
}

/**
 * Decides whether to accept a remote update over a local record using Last-Write-Wins (LWW).
 */
export function mergeRecord(
  localRecord: { updatedAt?: string; [key: string]: any } | null,
  remoteRecord: SyncRecordPayload
): MergeResult {
  if (!localRecord) {
    if (remoteRecord.deleted) {
      return { record: null, action: 'delete' }
    }
    return { record: remoteRecord.data, action: 'apply_remote' }
  }

  const localTime = localRecord.updatedAt ? new Date(localRecord.updatedAt).getTime() : 0
  const remoteTime = new Date(remoteRecord.updated_at).getTime()

  // Last-Write-Wins
  if (remoteTime >= localTime) {
    if (remoteRecord.deleted) {
      return { record: null, action: 'delete' }
    }
    return { record: remoteRecord.data, action: 'apply_remote' }
  } else {
    // Local is newer
    return { record: localRecord, action: 'keep_local' }
  }
}

/**
 * Resolves a batch of remote records against a local record dictionary.
 */
export function resolveBatchMerge(
  localMap: Map<string, { updatedAt?: string; [key: string]: any }>,
  remoteList: SyncRecordPayload[]
): {
  appliedCount: number
  deletedCount: number
  keptLocalCount: number
  finalMap: Map<string, any>
} {
  let appliedCount = 0
  let deletedCount = 0
  let keptLocalCount = 0
  const finalMap = new Map(localMap)

  for (const remote of remoteList) {
    const local = localMap.get(remote.id) || null
    const result = mergeRecord(local, remote)

    if (result.action === 'apply_remote') {
      finalMap.set(remote.id, result.record)
      appliedCount++
    } else if (result.action === 'delete') {
      finalMap.delete(remote.id)
      deletedCount++
    } else {
      keptLocalCount++
    }
  }

  return {
    appliedCount,
    deletedCount,
    keptLocalCount,
    finalMap,
  }
}
