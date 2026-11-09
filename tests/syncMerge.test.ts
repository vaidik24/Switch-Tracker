import { describe, it, expect } from 'vitest'
import { mergeRecord, resolveBatchMerge, SyncRecordPayload } from '../src/lib/syncMerge'

describe('syncMerge (Last-Write-Wins and Tombstones)', () => {
  it('applies remote record when local record is null', () => {
    const remote: SyncRecordPayload = {
      entity: 'problems',
      id: '1',
      data: { id: 1, title: 'Two Sum' },
      updated_at: '2026-10-26T10:00:00Z',
      deleted: false,
    }

    const res = mergeRecord(null, remote)
    expect(res.action).toBe('apply_remote')
    expect(res.record?.title).toBe('Two Sum')
  })

  it('deletes record when remote record has deleted = true (Tombstone)', () => {
    const local = { id: 1, title: 'Two Sum', updatedAt: '2026-10-26T09:00:00Z' }
    const remote: SyncRecordPayload = {
      entity: 'problems',
      id: '1',
      data: {},
      updated_at: '2026-10-26T10:00:00Z',
      deleted: true,
    }

    const res = mergeRecord(local, remote)
    expect(res.action).toBe('delete')
    expect(res.record).toBeNull()
  })

  it('keeps local record if local updatedAt is newer than remote', () => {
    const local = { id: 1, title: 'Two Sum (Optimized)', updatedAt: '2026-10-26T12:00:00Z' }
    const remote: SyncRecordPayload = {
      entity: 'problems',
      id: '1',
      data: { id: 1, title: 'Two Sum (Old)' },
      updated_at: '2026-10-26T10:00:00Z',
      deleted: false,
    }

    const res = mergeRecord(local, remote)
    expect(res.action).toBe('keep_local')
    expect(res.record?.title).toBe('Two Sum (Optimized)')
  })

  it('resolves batch merges properly with counts', () => {
    const localMap = new Map<string, any>([
      ['1', { id: '1', title: 'Problem 1', updatedAt: '2026-10-26T08:00:00Z' }],
      ['2', { id: '2', title: 'Problem 2 (Newer)', updatedAt: '2026-10-26T12:00:00Z' }],
      ['3', { id: '3', title: 'Problem 3', updatedAt: '2026-10-26T08:00:00Z' }],
    ])

    const remoteBatch: SyncRecordPayload[] = [
      {
        entity: 'problems',
        id: '1',
        data: { id: '1', title: 'Problem 1 (Updated Remotely)' },
        updated_at: '2026-10-26T10:00:00Z',
        deleted: false,
      },
      {
        entity: 'problems',
        id: '2',
        data: { id: '2', title: 'Problem 2 (Stale Remote)' },
        updated_at: '2026-10-26T09:00:00Z',
        deleted: false,
      },
      {
        entity: 'problems',
        id: '3',
        data: {},
        updated_at: '2026-10-26T11:00:00Z',
        deleted: true, // tombstone
      },
      {
        entity: 'problems',
        id: '4',
        data: { id: '4', title: 'Problem 4 (Brand New)' },
        updated_at: '2026-10-26T10:30:00Z',
        deleted: false,
      },
    ]

    const result = resolveBatchMerge(localMap, remoteBatch)

    expect(result.appliedCount).toBe(2) // 1 and 4
    expect(result.deletedCount).toBe(1) // 3
    expect(result.keptLocalCount).toBe(1) // 2
    expect(result.finalMap.get('1')?.title).toBe('Problem 1 (Updated Remotely)')
    expect(result.finalMap.get('2')?.title).toBe('Problem 2 (Newer)')
    expect(result.finalMap.has('3')).toBe(false)
    expect(result.finalMap.get('4')?.title).toBe('Problem 4 (Brand New)')
  })
})
