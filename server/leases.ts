import type { Store } from './store'

export const LEASE_TTL = 10_000 // 10s — client renews every 3s, 2-miss grace period

export function startLeaseChecker(store: Store): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const { activeTuner, queue } = store.getState()
    const now = Date.now()

    if (activeTuner && activeTuner.expiresAt < now) {
      console.log(`Lease expired for active tuner ${activeTuner.userId} (${activeTuner.name})`)
      store.dispatch({ type: 'LEASE_EXPIRED', userId: activeTuner.userId })
    }

    for (const lease of queue) {
      if (lease.expiresAt < now) {
        console.log(`Lease expired for queued user ${lease.userId} (${lease.name})`)
        store.dispatch({ type: 'LEASE_EXPIRED', userId: lease.userId })
      }
    }
  }, 1000)
}
