import type { ServerState } from './state'
import type { Event } from './events'
import { reducer } from './reducer'

type Subscriber = (state: ServerState, event: Event) => void

export class Store {
  private state: ServerState
  private subscribers: Subscriber[] = []

  constructor(initialState: ServerState) {
    this.state = initialState
  }

  dispatch(event: Event): void {
    this.state = reducer(this.state, event)
    for (const fn of this.subscribers) {
      fn(this.state, event)
    }
  }

  subscribe(fn: Subscriber): void {
    this.subscribers.push(fn)
  }

  getState(): ServerState {
    return this.state
  }
}
