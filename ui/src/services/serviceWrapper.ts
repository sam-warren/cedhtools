import axios, { AxiosError } from 'axios';
import { IApiResponse, IErrorResponse } from 'src/types';

/**
 * Generic service wrapper for API calls.
 * @param requestFn Function that performs the specific API request.
 * @param handleServiceErrors Callback to handle service-specific errors based on status codes.
 */
export async function serviceWrapper<T>(
  requestFn: () => Promise<T>,
  handleServiceErrors?: (status: number, data: any) => IErrorResponse | null,
): Promise<IApiResponse<T>> {
  try {
    const data = await requestFn();
    return { success: true, data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;

      if (axiosError.response) {
        const { status, data } = axiosError.response;

        if (handleServiceErrors) {
          const serviceError = handleServiceErrors(status, data);
          if (serviceError) return serviceError;
        }

        return {
          success: false,
          error: `Unexpected error (status ${status}): ${data?.error || 'An unexpected error occurred.'}`,
          statusCode: status,
        };
      }

      return {
        success: false,
        error: 'No response from the server. Please check your connection.',
        statusCode: 0,
      };
    }

    return {
      success: false,
      error: `Unexpected error: ${String(error)}`,
      statusCode: 0,
    };
  }
}
