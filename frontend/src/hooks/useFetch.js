// src/hooks/useFetch.js
import { useEffect, useReducer } from "react";

function reducer(state, action) {
  switch (action.type) {
    case "loading": return { data: null, loading: true, error: null };
    case "success": return { data: action.payload, loading: false, error: null };
    case "error":   return { data: null, loading: false, error: action.payload };
    default: return state;
  }
}

/**
 * @param {() => Promise<any>} fetcher  An async function that returns data
 * @param {any[]} deps                  Dependency array (re-fetches when these change)
 */
export function useFetch(fetcher, deps = []) {
  const [state, dispatch] = useReducer(reducer, {
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });

    fetcher()
      .then((data) => {
        if (!cancelled) dispatch({ type: "success", payload: data });
      })
      .catch((err) => {
        if (!cancelled) dispatch({ type: "error", payload: err.message });
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
