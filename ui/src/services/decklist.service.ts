import axios from 'axios';

const BASE_URL = import.meta.env.VITE_CEDHTOOLS_API_BASE_URL;

export async function getDecklistById(id: string) {
  const url = `${BASE_URL}/api/moxfield/deck/${id}`;
  try {
    const response = await axios.get(url, {
      withCredentials: true,
    });
    console.log('response: ', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching decklist: ', error);
    throw error;
  }
}
