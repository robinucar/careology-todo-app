import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AUTH_SESSION_CLEARED_EVENT,
  clearStoredAuthSession,
  getStoredAuthSession,
  storeAuthSession,
  type AuthSession,
} from '../../../src/app/authSession'

const STORAGE_KEY = 'careology.auth.session'

const authSession: AuthSession = {
  token: 'test-token',
  user: {
    id: 'user-1',
    name: 'Task Master',
    email: 'task.master@example.com',
  },
}

describe('authSession', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('stores persistent sessions in localStorage and clears sessionStorage', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authSession))

    storeAuthSession(authSession, 'local')

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual(authSession)
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(getStoredAuthSession()).toEqual(authSession)
  })

  it('stores non-persistent sessions in sessionStorage and clears localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authSession))

    storeAuthSession(authSession, 'session')

    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '')).toEqual(authSession)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(getStoredAuthSession()).toEqual(authSession)
  })

  it('falls back to sessionStorage when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not-valid-json')
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authSession))

    expect(getStoredAuthSession()).toEqual(authSession)
  })

  it('ignores malformed stored sessions instead of crashing', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 'missing-user' }))

    expect(getStoredAuthSession()).toBeNull()
  })

  it('clears auth sessions from both storage types', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authSession))
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authSession))

    clearStoredAuthSession()

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('notifies the app when a stored auth session is cleared', () => {
    const listener = vi.fn()
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, listener)

    clearStoredAuthSession()

    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, listener)
  })
})
