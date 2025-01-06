import axios from 'axios';
import { IApiResponse, ICommanderStatisticsResponse } from '../../types';
import { serviceWrapper } from '../serviceWrapper';

const BASE_URL = import.meta.env.VITE_CEDHTOOLS_API_BASE_URL;

export async function getDeckStats(
  deck_id: string,
  time_period: string,
  min_size: number,
): Promise<IApiResponse<ICommanderStatisticsResponse>> {

  const url = `${BASE_URL}/api/decks/${deck_id}/analysis`;

  const params = new URLSearchParams();
  if (time_period) {
    params.append('time_period', time_period);
  }
  if (min_size) {
    params.append('min_size', min_size.toString());
  }
  return serviceWrapper(
    () =>
      axios
        .get<ICommanderStatisticsResponse>(url, {
          withCredentials: true,
          params,
        })
        .then((response) => response.data),
    (status, data) => {
      const errorMessages: Record<number, string> = {
        500:
          data?.error ||
          'An internal server error occurred. Please try again later.',
      };
      if (errorMessages[status]) {
        return {
          success: false,
          error: errorMessages[status],
          statusCode: status,
        };
      }
      return null;
    },
  );
}
