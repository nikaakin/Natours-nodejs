/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const response = await axios({
      method: 'post',
      url: '/api/v1/users/signin',
      data: {
        email,
        password
      }
    });

    if (response.data.status === 'success') {
      showAlert('success', "You've successfully logged in!");
      setTimeout(() => location.assign('/'), 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios.get('/api/v1/users/singout');
    if (res.data.status === 'success') {
      location.reload();
    }
  } catch (err) {
    showAlert('error', 'Problem while loggin out. Please try again!');
  }
};
