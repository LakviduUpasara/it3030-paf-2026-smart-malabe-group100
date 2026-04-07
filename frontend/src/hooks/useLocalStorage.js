import { useState } from "react";
import { readStorageValue, writeStorageValue } from "../utils/storage";

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValueState] = useState(() => {
    const existingValue = readStorageValue(key);
    return existingValue ?? initialValue;
  });

  const setStoredValue = (value) => {
    setStoredValueState((previousValue) => {
      const nextValue =
        typeof value === "function" ? value(previousValue) : value;

      writeStorageValue(key, nextValue);
      return nextValue;
    });
  };

  return [storedValue, setStoredValue];
}

