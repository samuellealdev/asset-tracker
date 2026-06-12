/**
 * Repository port for Event persistence.
 *
 * Implementations handle the actual storage (MongoDB, in-memory, etc.)
 * while the domain and application layers depend only on this contract.
 *
 * @typedef {Object} EventRepository
 * @property {(event: import('./event.js').Event) => Promise<void>} save
 *   Persist an event. Returns a Promise that resolves when the event is stored.
 *   Rejects with an error if persistence fails.
 */
