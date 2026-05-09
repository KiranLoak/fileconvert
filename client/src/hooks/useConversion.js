/**
 * useConversion — shared state machine for conversion tool pages.
 *
 * States: idle → uploading → processing → done | error
 *
 * Usage:
 *   const { state, uploadProgress, result, error, run, reset } = useConversion();
 *   await run(() => convertPdfToWord(file, (pct) => {}));
 */

import { useState, useCallback } from 'react';

export const STATES = {
  IDLE:       'idle',
  UPLOADING:  'uploading',
  PROCESSING: 'processing',
  DONE:       'done',
  ERROR:      'error',
};

export default function useConversion() {
  const [state, setState]               = useState(STATES.IDLE);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState(null);

  /**
   * Run a conversion.
   * @param {() => Promise<{success, data, error}>} apiFn
   *   Should call setState(UPLOADING) progress via onProgress internally.
   *   The fn receives setUploadProgress so it can report upload %.
   */
  const run = useCallback(async (apiFn) => {
    setState(STATES.UPLOADING);
    setUploadProgress(0);
    setError(null);
    setResult(null);

    const onProgress = (pct) => {
      setUploadProgress(pct);
      // When upload hits 100%, switch to processing state
      if (pct >= 100) setState(STATES.PROCESSING);
    };

    try {
      const res = await apiFn(onProgress);

      if (!res.success) {
        setError(res.error || 'Conversion failed. Please try again.');
        setState(STATES.ERROR);
        return;
      }

      setResult(res.data);
      setState(STATES.DONE);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setState(STATES.ERROR);
    }
  }, []);

  const reset = useCallback(() => {
    setState(STATES.IDLE);
    setUploadProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    state,
    uploadProgress,
    result,
    error,
    run,
    reset,
    isIdle:       state === STATES.IDLE,
    isUploading:  state === STATES.UPLOADING,
    isProcessing: state === STATES.PROCESSING,
    isBusy:       state === STATES.UPLOADING || state === STATES.PROCESSING,
    isDone:       state === STATES.DONE,
    isError:      state === STATES.ERROR,
  };
}
