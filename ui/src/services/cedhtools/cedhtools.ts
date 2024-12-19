import axios from 'axios';
import { IApiResponse, ICommanderStats } from '../../types';
import { serviceWrapper } from '../serviceWrapper';

const BASE_URL = import.meta.env.VITE_CEDHTOOLS_API_BASE_URL;

export async function getDeckStats(
  commander_ids: string[],
  start_date?: Date,
  end_date?: Date,
  tournament_size?: number,
  top_cut?: number,
): Promise<IApiResponse<ICommanderStats>> {
  const url = `${BASE_URL}/api/cedhtools/commander/statistics`;

  const params = new URLSearchParams();
  if (commander_ids.length > 0) {
    commander_ids.forEach((id) => params.append('commander_ids', id));
  }
  if (start_date)
    params.append('start_date', (start_date.getTime() / 1000).toString());
  if (end_date)
    params.append('end_date', (end_date.getTime() / 1000).toString());
  if (tournament_size !== undefined)
    params.append('tournament_size', tournament_size.toString());
  if (top_cut !== undefined) params.append('top_cut', top_cut.toString());

  return serviceWrapper(
    () =>
      axios
        .get<ICommanderStats>(url, {
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
