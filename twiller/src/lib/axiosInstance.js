import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://twiller-2-0-yjv4.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;