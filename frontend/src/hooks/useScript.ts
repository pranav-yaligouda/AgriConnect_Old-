import { useState, useEffect } from 'react';

// Hook for dynamically loading external scripts
export const useScript = (src: string) => {
  // Keep track of script status ("idle", "loading", "ready", "error")
  const [status, setStatus] = useState(
    src ? 'loading' : 'idle'
  );

  useEffect(() => {
    // Allow falsy src value if waiting on other data needed for script creation
    if (!src) {
      setStatus('idle');
      return;
    }

    // Check if script already exists in document
    let script = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;

    if (script) {
      // Script exists but might still be loading
      setStatus(script.getAttribute('data-status') || (script.getAttribute('async') ? 'loading' : 'ready'));
    } else {
      // Create script
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.setAttribute('data-status', 'loading');
      document.body.appendChild(script);

      // Store status in attribute on script
      // This can be read by other instances of this hook
      const setAttributeFromEvent = (event: Event) => {
        const status = event.type === 'load' ? 'ready' : 'error';
        script.setAttribute('data-status', status);
        setStatus(status);
      };

      script.addEventListener('load', setAttributeFromEvent);
      script.addEventListener('error', setAttributeFromEvent);
    }

    // Script event handler to update status in hook state
    const setStateFromEvent = (event: Event) => {
      setStatus(event.type === 'load' ? 'ready' : 'error');
    };

    // Add event listeners
    script.addEventListener('load', setStateFromEvent);
    script.addEventListener('error', setStateFromEvent);

    // Remove event listeners on cleanup
    return () => {
      if (script) {
        script.removeEventListener('load', setStateFromEvent);
        script.removeEventListener('error', setStateFromEvent);
      }
    };
  }, [src]); // Only re-run effect if script src changes

  return status;
};

export default useScript; 