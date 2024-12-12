import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_CEDHTOOLS_API_BASE_URL;

export async function getDecklistById(id: string): Promise<any> { // TODO: Define type for promise
  const url = `${BASE_URL}/api/moxfield/deck/${id}`;
  try {
    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const { status, data } = axiosError.response as {status: number, data: any}; // TODO: Create data model for data response
        if (status === 404) {
          throw new Error(data.error || 'Deck not found. Please check the URL and try again.');
        } else if (status === 400) {
          throw new Error(data.error || 'Invalid deck data. Decks must contain exactly 100 cards and be selected as Commander decks.'); // TODO: Create data model for response
        } else if (status === 500) {
          throw new Error(data.error || 'An internal server error occurred. Please try again later.');
        }
      } else if (axiosError.request) {
        throw new Error('No response from the server. Please check your connection and try again.');
      } else {
        throw new Error(`Unexpected error: ${axiosError.message}`);
      }
    } else {
      throw new Error(`Unexpected error: ${error}`);
    }
  }
}
