const config = require('../config/main');
const axios = require('axios');

// Initialize NOWPayments client

exports.createInvoice = async (payment) => {
  const paymentData = {
    price_amount: payment.price,
    price_currency: payment.currency,
    ipn_callback_url: `${config.baseURL}/api/depositPaymentCallback`,
    success_url: `${config.frontendURL}/wallet`,
    cancel_url: `${config.frontendURL}/wallet`,
    order_id: payment.id,
    is_fixed_rate: true,
    is_fee_paid_by_user: false,
    order_description: payment.description || 'Payment Invoice'
  };

  try {
    const nowpaymentRes = await axios.post(`${config.nowPayment.endpoint}/v1/invoice`, paymentData, {
      headers: { "Content-Type": " application/json", "x-api-key": config.nowPayment.apiKey },
    });

    return nowpaymentRes
  } catch (error) {
    return {
      status: 0,
      msg: error.message || "Failed to create invoice"
    }
  }

  // try {
  //   const invoice = await nowPaymentsClient.createInvoice(paymentData);

  //   console.log(invoice);
  //   return {
  //     status: 1,
  //     data: invoice
  //   };
  // } catch (error) {
  //   console.error('NOWPayments invoice creation error:', error);
  //   return {
  //     status: 0,
  //     msg: error.message || 'Failed to create invoice'
  //   };
  // }
};

const getAuthToken = async () => {
  try {
    const authResponse = await api.auth({
      email: process.env.NOWPAYMENTS_EMAIL,
      password: process.env.NOWPAYMENTS_PASSWORD
    });
    return authResponse.token;
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

exports.createWithdrawal = async (amount, currency, address) => {
  try {
    // First authenticate
    const token = getAuthToken();

    // Create payout
    const payout = await api.createPayout({
      withdrawals: [{
        address: address,  // Withdrawal address
        currency: currency, // Payout currency
        amount: amount    // Amount to withdraw
      }],
      token: token
    });

    // Check payout status
    const status = await api.getPayoutStatus({
      payout_id: payout.id
    });

    return {
      payout: payout,
      status: status
    };
  } catch (error) {
    console.error('Withdrawal error:', error);
    throw error;
  }
}

// Check balance function
exports.checkBalance = async () => {
  try {
    const { token } = getAuthToken();

    const balance = await api.getBalance({ token });
    return balance;
  } catch (error) {
    console.error('Balance check error:', error);
    throw error;
  }
}