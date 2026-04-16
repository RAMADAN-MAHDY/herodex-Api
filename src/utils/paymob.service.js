import axios from 'axios';
import crypto from 'crypto';

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';

/**
 * Paymob Service to handle all payment related operations
 */
class PaymobService {
  constructor() {
    this.apiKey = process.env.PAYMOB_API_KEY;
    this.hmacSecret = process.env.PAYMOB_HMAC_SECRET;
    this.iframeId = process.env.PAYMOB_IFRAME_ID;
    this.walletIntegrationId = process.env.PAYMOB_WALLET_INTEGRATION_ID;
  }

  /**
   * Step 1: Authenticate with Paymob and get a token
   * @returns {Promise<string>} Authentication token
   */
  async authenticate() {
    try {
      const response = await axios.post(`${PAYMOB_BASE_URL}/auth/tokens`, {
        api_key: this.apiKey,
      });
      return response.data.token;
    } catch (error) {
      console.error('Paymob Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Paymob');
    }
  }

  /**
   * Step 2: Register an order in Paymob
   * @param {string} token 
   * @param {Object} orderData 
   * @returns {Promise<number>} Paymob Order ID
   */
  async registerOrder(token, { amountCents, currency = 'EGP', items = [] }) {
    try {
      const response = await axios.post(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
        auth_token: token,
        delivery_needed: 'false',
        amount_cents: amountCents,
        currency: currency,
        items: items,
      });
      return response.data.id;
    } catch (error) {
      console.error('Paymob Order Registration Error:', error.response?.data || error.message);
      throw new Error('Failed to register order with Paymob');
    }
  }

  /**
   * Step 3: Generate a payment key
   * @param {string} token 
   * @param {Object} paymentData 
   * @returns {Promise<string>} Payment Key
   */
  async generatePaymentKey(token, { amountCents, orderId, billingData, integrationId }) {
    try {
      const response = await axios.post(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
        auth_token: token,
        amount_cents: amountCents,
        expiration: 3600, // 1 hour
        order_id: orderId,
        billing_data: billingData,
        currency: 'EGP',
        integration_id: integrationId,
      });
      return response.data.token;
    } catch (error) {
      console.error('Paymob Payment Key Error:', error.response?.data || error.message);
      throw new Error('Failed to generate Paymob payment key');
    }
  }

  /**
   * Optional: For Wallet payments, get the redirect URL
   * @param {string} paymentKey 
   * @param {string} walletNumber 
   * @returns {Promise<string>} Redirect URL
   */
  async getWalletRedirectUrl(paymentKey, walletNumber) {
    try {
      const response = await axios.post(`${PAYMOB_BASE_URL}/acceptance/payments/pay`, {
        source: {
          identifier: walletNumber,
          subtype: 'WALLET',
        },
        payment_token: paymentKey,
      });
      return response.data.iframe_redirection_url;
    } catch (error) {
      console.error('Paymob Wallet Pay Error:', error.response?.data || error.message);
      throw new Error('Failed to get Paymob wallet redirect URL');
    }
  }

  /**
   * Verify HMAC signature for webhooks
   * @param {Object} hmacData 
   * @param {string} receivedHmac 
   * @returns {boolean}
   */
  verifyHMAC(hmacData, receivedHmac) {
    // Paymob HMAC calculation order is very specific
    const fields = [
      'amount_cents',
      'created_at',
      'currency',
      'error_occured',
      'has_parent_transaction',
      'id',
      'integration_id',
      'is_3d_secure',
      'is_auth',
      'is_capture',
      'is_refunded',
      'is_standalone_payment',
      'is_voided',
      'order.id',
      'owner',
      'pending',
      'source_data.pan',
      'source_data.sub_type',
      'source_data.type',
      'success',
    ];

    const stringToHash = fields
      .map((field) => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], hmacData);
        // Normalize booleans and undefined
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return value ?? '';
      })
      .join('');

    const calculatedHmac = crypto
      .createHmac('sha512', this.hmacSecret)
      .update(stringToHash)
      .digest('hex');

    return calculatedHmac === receivedHmac;
  }
}

export default new PaymobService();
