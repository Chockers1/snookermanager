import { encodeCareerSave } from './saveStorage';
import { rememberSaveMetadata } from './saveMetadata';

/** Serialize bounded pieces between browser tasks so an autosave cannot monopolise
 * the UI with one 100 MB JSON.stringify. State snapshots are immutable while queued. */
export async function serializeCareerSave(state: unknown): Promise<string> {
  let sliceStarted = performance.now();
  const serialize = async (value: unknown, depth: number): Promise<string | undefined> => {
    if (performance.now() - sliceStarted >= 6) {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      sliceStarted = performance.now();
    }
    if (!depth || !value || typeof value !== 'object' || 'toJSON' in value) return JSON.stringify(value);
    if (Array.isArray(value)) {
      const pieces: string[] = [];
      for (const item of value) pieces.push(await serialize(item, depth - 1) ?? 'null');
      return '[' + pieces.join(',') + ']';
    }
    const pieces: string[] = [];
    for (const [key, item] of Object.entries(value)) {
      const json = await serialize(item, depth - 1);
      if (json !== undefined) pieces.push(JSON.stringify(key) + ':' + json);
    }
    return '{' + pieces.join(',') + '}';
  };
  const json = await serialize(state, 3);
  if (json === undefined) throw new Error('No career data to save.');
  return json;
}

/** Keep expensive compression away from input/rendering. The worker compresses the supplied JSON once, without parsing it again. */
export function encodeCareerSaveAsync(state: unknown): Promise<string> {
  if (typeof Worker === 'undefined') return Promise.resolve(encodeCareerSave(state));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./saveCodec.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ payload?: string; error?: string }>) => {
      worker.terminate();
      if (!event.data.payload) { reject(new Error(event.data.error ?? 'Save compression failed.')); return; }
      rememberSaveMetadata(event.data.payload, state); resolve(event.data.payload);
    };
    worker.onerror = () => { worker.terminate(); reject(new Error('Save compression could not run. Export a portable backup in Save Manager.')); };
    void serializeCareerSave(state).then(json => worker.postMessage(json)).catch(error => { worker.terminate(); reject(error); });
  });
}
