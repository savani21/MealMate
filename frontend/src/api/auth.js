import { API_BASE_URL } from "./config.js";
import axios from "axios";

const API = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
});

export default API;