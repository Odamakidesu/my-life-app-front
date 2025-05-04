import axios from "axios";
import { Tag } from "../types/tags";

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/tags`;
const token = localStorage.getItem("token");

export const fetchTags = async (): Promise<Tag[]> => {
  const response = await axios.get<Tag[]>(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }); // 仮のURL
  return response.data;
};