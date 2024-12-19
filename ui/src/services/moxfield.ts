import { serviceWrapper } from './serviceWrapper';
import axios from 'axios';
import { ApiResponse, IMoxfieldDeck } from '../types';

const BASE_URL = import.meta.env.VITE_CEDHTOOLS_API_BASE_URL;

export async function getDecklistById(
  id: string,
): Promise<ApiResponse<IMoxfieldDeck>> {
  const url = `${BASE_URL}/api/moxfield/deck/${id}`;

  return serviceWrapper(
    () =>
      axios
        .get<IMoxfieldDeck>(url, { withCredentials: true })
        .then((response) => response.data),
    (status, data) => {
      const errorMessages: Record<number, string> = {
        404:
          data?.error || 'Deck not found. Please check the URL and try again.',
        400:
          data?.error ||
          'Invalid deck data. Decks must contain exactly 100 cards and be selected as Commander decks.',
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
