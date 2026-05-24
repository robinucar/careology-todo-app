export type AuthSessionUser = {
  id: string
  name: string
  email: string
}

export type AuthSession = {
  token: string
  user: AuthSessionUser
}

export type AuthSessionPersistence = 'local' | 'session'

export const AUTH_SESSION_CLEARED_EVENT = 'careology.auth.session.cleared'
const AUTH_SESSION_STORAGE_KEY = 'careology.auth.session'

const isBrowser = () => typeof window !== 'undefined'

const getStorage = (persistence: AuthSessionPersistence) => {
  if (!isBrowser()) {
    return null
  }

  return persistence === 'local' ? window.localStorage : window.sessionStorage
}

const notifyAuthSessionCleared = () => {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(new Event(AUTH_SESSION_CLEARED_EVENT))
}

const parseStoredSession = (value: string | null): AuthSession | null => {
  if (!value) {
    return null
  }

  try {
    const session = JSON.parse(value) as Partial<AuthSession>

    if (
      typeof session.token === 'string' &&
      typeof session.user?.id === 'string' &&
      typeof session.user.email === 'string' &&
      typeof session.user.name === 'string'
    ) {
      return {
        token: session.token,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
      }
    }
  } catch {
    return null
  }

  return null
}

export const getStoredAuthSession = (): AuthSession | null => {
  const localSession = parseStoredSession(
    getStorage('local')?.getItem(AUTH_SESSION_STORAGE_KEY) ?? null,
  )

  if (localSession) {
    return localSession
  }

  return parseStoredSession(
    getStorage('session')?.getItem(AUTH_SESSION_STORAGE_KEY) ?? null,
  )
}

export const storeAuthSession = (
  session: AuthSession,
  persistence: AuthSessionPersistence,
) => {
  const targetStorage = getStorage(persistence)
  const fallbackStorage = getStorage(persistence === 'local' ? 'session' : 'local')

  targetStorage?.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
  fallbackStorage?.removeItem(AUTH_SESSION_STORAGE_KEY)
}

export const clearStoredAuthSession = () => {
  getStorage('local')?.removeItem(AUTH_SESSION_STORAGE_KEY)
  getStorage('session')?.removeItem(AUTH_SESSION_STORAGE_KEY)
  notifyAuthSessionCleared()
}
