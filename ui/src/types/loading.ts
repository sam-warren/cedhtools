import { Dispatch, SetStateAction } from "react";

export interface ILoadingContext {
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}
