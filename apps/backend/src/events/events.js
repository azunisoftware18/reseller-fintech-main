import { EventEmitter } from 'node:events';

export const eventBus = new EventEmitter();

// optional (production safety)
eventBus.setMaxListeners(50);
