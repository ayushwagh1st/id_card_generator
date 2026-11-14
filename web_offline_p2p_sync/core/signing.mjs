export function signingData(item) {
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => [key, canonical(value[key])])) : value;
  return JSON.stringify(canonical({ id: item.id, entity: item.entity, action: item.action, payload: item.payload, timestamp: item.timestamp, actorId: item.actorId, deviceId: item.deviceId, scope: item.scope, legacy: item.legacy || false }));
}
