// Collector registry
// Register all data source collectors here

import { Collector } from './base';
import { fdnyDispatchCollector } from './fdny-dispatch';
import { nypdCallsCollector } from './nypd-calls';
import { nwsAlertsCollector } from './nws-alerts';

// All registered collectors
export const collectors: Collector[] = [
  fdnyDispatchCollector,
  nypdCallsCollector,
  nwsAlertsCollector,
];

// Get collector by name
export function getCollector(name: string): Collector | undefined {
  return collectors.find(c => c.name === name);
}

// Group collectors by poll interval
export function getCollectorsByInterval(): Map<number, Collector[]> {
  const byInterval = new Map<number, Collector[]>();
  
  for (const collector of collectors) {
    const interval = collector.pollIntervalMs;
    const group = byInterval.get(interval) || [];
    group.push(collector);
    byInterval.set(interval, group);
  }
  
  return byInterval;
}

// Export individual collectors for direct use
export { fdnyDispatchCollector } from './fdny-dispatch';
export { nypdCallsCollector } from './nypd-calls';
export { nwsAlertsCollector } from './nws-alerts';
export type { Collector, CollectorResult, RawRecord } from './base';

