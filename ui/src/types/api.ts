export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
