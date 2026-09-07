import { encodeCareerSave } from './saveStorage';
import { rememberSaveMetadata } from './saveMetadata';

/** Keep expensive compression away from input/rendering. The payload format is unchanged. */
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
    try { worker.postMessage(JSON.stringify(state)); } catch (error) { worker.terminate(); reject(error); }
  });
}
