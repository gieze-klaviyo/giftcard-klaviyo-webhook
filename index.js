const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// 🔁 Match variant ID to the correct image
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

// 🚀 This is the webhook receiver
app.post('/', async (req, res) => {
  console.log('🔔 Shopify webhook received'); // ✅ You'll see this in Render logs

  const order = req.body;
  const giftCards = order.gift_cards || [];
  const customer = order.customer;

  if (giftCards.length && customer) {
    try {
      for (const giftCard of giftCards) {
        const variantId = giftCard.line_item?.variant_id;

        await axios.post('https://a.klaviyo.com/api/track', {
          token: 'pk_5ad6285e8e5b68f8cfc593f5ccef953374',
          event: 'Gift Card Purchased',
          customer_properties: {
            $email: customer.email,
            $first_name: customer.first_name
          },
          properties: {
            giftcard_code: giftCard.code,
            giftcard_amount: giftCard.initial_value,
            language: order.customer_locale,
            image_url: getImageURL(variantId)
          },
          time: order.created_at
        });
      }

      res.status(200).send('Klaviyo events sent');
    } catch (err) {
      console.error('❌ Failed to send to Klaviyo:', err);
      res.status(500).send('Failed to send to Klaviyo');
    }
  } else {
    console.log('⚠️ No gift cards or customer info found in this order');
    res.status(200).send('No gift cards or customer info found');
  }
});

app.listen(3000, () => console.log('🚀 Server running on port 3000'));
