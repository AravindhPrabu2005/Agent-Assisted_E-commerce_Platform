import axios from 'axios';

const axiosInstance = axios.create({
     baseURL:"https://ekadai.aravindhprabu.me/"
});
// https://ekadai.aravindhprabu.me/
// http://localhost:5000

export default axiosInstance;