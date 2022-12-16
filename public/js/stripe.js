/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51MFc4JHxeiuIskGfotk0647Oso5H7OAMdBxmvNTbw02PUaUOXp548ni75KXHhwI5p7EBRWVuRj8t8astqEeDQDSH00WuXSd0Dx'
);

export const bookTour = async tourId => {
  try {
    const session = await axios.get(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
    );

    stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
