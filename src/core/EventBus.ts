import type { GameEvents } from './GameContracts';

export type EventHandler<T> = (payload: T) => void;
export type Unsubscribe = () => void;

/** Bus síncrono tipado. Cada suscripción devuelve una función de limpieza idempotente. */
export class TypedEventBus<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<EventHandler<never>>>();

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): Unsubscribe {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }
    const typedHandler = handler as EventHandler<never>;
    handlers.add(typedHandler);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      handlers?.delete(typedHandler);
      if (handlers?.size === 0) this.listeners.delete(event);
    };
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of [...handlers]) (handler as EventHandler<Events[K]>)(payload);
  }

  clear(): void {
    this.listeners.clear();
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export const eventBus = new TypedEventBus<GameEvents>();
