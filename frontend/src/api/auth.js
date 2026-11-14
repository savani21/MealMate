import axios from "axios";

const API = axios.create({
  baseURL: "/api/auth",
});

export default API;