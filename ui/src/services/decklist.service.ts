import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function getDecklistById(id: string) {
  const url = `${BASE_URL}/decklist/${id}`;
  const response = await axios.get(url);
  console.log("response: ", response);
  return response;
}