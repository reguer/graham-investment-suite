import { useEffect, useState } from "react";
import { loadCompanies, saveCompanies } from "../lib/storage.js";

export function usePersistedState(initialValue = []) {
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadCompanies().then((stored) => {
      if (mounted) {
        setValue(Array.isArray(stored) ? stored : initialValue);
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (ready) saveCompanies(value);
  }, [ready, value]);

  return [value, setValue, ready];
}
