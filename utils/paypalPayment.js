const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

const configureEnvironment = function () {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_SECRET

  return process.env.NODE_ENV === 'production'
    ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
    : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret)
}

exports.client = () => {
  return new checkoutNodeJssdk.core.PayPalHttpClient(configureEnvironment())
}