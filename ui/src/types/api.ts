export interface ISuccessResponse<T> {
  success: true;
  data: T;
}

export interface IErrorResponse {
  success: false;
  error: string;
  statusCode: number;
}

export type IApiResponse<T> = ISuccessResponse<T> | IErrorResponse;
