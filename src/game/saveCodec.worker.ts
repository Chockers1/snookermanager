import { encodeCareerSave } from './saveStorage';
self.onmessage = (event: MessageEvent<string>) => {
  try { self.postMessage({ payload: encodeCareerSave(JSON.parse(event.data)) }); }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Save compression failed.' }); }
};
