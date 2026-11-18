# GG Vintage Collection — starter storefront

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser. For the best local development experience, use VS Code + Live Server.

## Included
- Responsive black, gold and cream storefront
- Supplied GG campaign artwork used in the hero
- Product catalogue with demo products and GHS prices
- Category filters and product search
- Shopping bag with quantity controls and local browser persistence
- Checkout form with Mobile Money, card, bank transfer and cash-on-delivery choices
- Demo order-summary download

## Important before going live
This is a front-end prototype. It does not take real payments, send orders to a business, calculate delivery, or store customer orders on a server. Do not collect or process card details with static HTML/JavaScript.

To launch for real:
1. Replace demo product names, prices, descriptions and artwork in `script.js` with the actual catalogue.
2. Add the business phone number, email, social links, delivery policy, returns policy and privacy policy.
3. Connect a secure backend/order database.
4. Integrate a Ghana-supported payment gateway (for example Paystack or Flutterwave) for Mobile Money and cards; verify payment server-side using secret keys kept on the server.
5. Add bank-transfer instructions and a process for confirming transfers.
6. Confirm delivery coverage, delivery charges and whether cash on delivery is available in each area.
7. Deploy to a domain with HTTPS.

The supplied screenshot references are retained in `assets/` for design reference.
