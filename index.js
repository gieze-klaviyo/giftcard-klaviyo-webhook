const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const KLAVIYO_PUBLIC_KEY = 'XcGGPF'; // Your actual Klaviyo public key

function getImageURL(variantId) {
  switch (variantId) {
    case 50380966658351:
      return 'https://cdn.shopify.com/s/files/1/0854/2244/0751/files/9.png?v=1724145631';
    case 50380966691119:
      return 'https://cdn.shopify.com/s/files/1/0854/2244/0751/files/10.png?v=1724145631';
    case 50168298307887:
      return 'https://cdn.shopify.com/s/files/1/0854/2244/0751/files/11.png?v=1724145631';
    case 50380966756655:
      return 'https://cdn.shopify.com/s/files/1/0854/2244/0751/files/13.png?v=1724145631';
    default:
      return 'https://cdn.shopify.com/s/files/1/0854/2244/0751/files/9.png?v=1724145631';
  }
}

app.post('/', async (req, res) => {
  console.log('🔔 Shopify webhook received');

  const order = req.body;
  const customer = order?.customer;
  const giftCards = order?.gift_cards;

  if (!giftCards?.length || !customer?.email) {
    console.log('⚠️ No gift cards or customer info found in this order');
    return res.status(200).send('No gift cards or customer info found');
  }

  try {
    for (const giftCard of giftCards) {
      const payload = {
        token: KLAVIYO_PUBLIC_KEY,
        event: 'Gift Card Purchased Event',
        customer_properties: {
          $email: customer.email,
          $first_name: customer.first_name || '',
        },
        properties: {
          giftcard_code: giftCard.code || '',
          giftcard_amount: giftCard.initial_value || 0,
          image_url: getImageURL(giftCard.line_item?.variant_id),
          language: order.customer_locale || 'en',
          order_id: order.id
        },
        time: Math.floor(new Date(order.created_at).getTime() / 1000)
      };

      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');

      const response = await axios.post(
        'https://a.klaviyo.com/api/track',
        `data=${encoded}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      console.log('✅ Klaviyo responded:', response.data);
    }

    res.status(200).send('Gift card event(s) sent to Klaviyo');
  } catch (err) {
    console.error('❌ Error sending to Klaviyo:', err.response?.data || err.message);
    res.status(500).send('Error sending event to Klaviyo');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
