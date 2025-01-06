// src/components/Providers/SymbologyInitializer.tsx
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { fetchSymbology } from 'src/store/slices/symbologySlice';

export function SymbologyInitializer() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.symbology.status);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchSymbology());
    }
  }, [dispatch, status]);

  return null;
}
