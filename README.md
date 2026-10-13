# Aureji Claws

Aureji Claws is a website for browsing and ordering press-on nails. Customers can submit delivery details, pay through GCash, and upload payment proof. Admins log in with a password + emailed OTP, review submitted orders, and approve or reject verified payments — approval triggers a confirmation email to the customer. The admin dashboard also manages the live site's product catalog, hero/Instagram content, and service bookings.

## FRONTEND

### Overview
The Aureji Claws frontend lets customers browse the brand, shop press-on nails, check out through GCash, and book nail services. A single admin manages the site's content through a dashboard. It is built with plain HTML, CSS, and JavaScript, with a mix of shared and page-specific stylesheets, and it loads live data from the backend API with `fetch()`. The design follows the Aureji Claws branding and color palette, is responsive down to mobile screens, and reuses one header and footer across every page.

### Color Palette
| Color | Hex |
|---|---|
| White | #FFFFFF |
| Beige White | #FCFCF5 |
| Rose Pink | #F488A6 |
| Blush Pink | #FFD1E0 |
| Pale Blue | #C5DBEE |
| Blue-Violet | #8296D3 |
| Sage | #9DA58B |
| Dark Olive | #696D51 |
| Espresso | #6B4D48 |

### Pages

**Home** – Landing page with a 3-image hero slideshow (dot navigation), feature cards linking to Press-on and Services, and a "Claw Club" section showing Instagram posts and reels that open the original post.

**About** – The brand story and background.

**Press-on** – Product grid showing photo, name, price, and description. Products can be sorted or filtered by Latest Release, Best Selling, or Availability. "Buy Now" goes straight to checkout, and the cart icon adds the item to the cart.

**Services** – The service menu, organized into Nails, Nail Extension, Nail Art, and add-ons, with names and prices. A note explains that custom press-ons are ordered through Instagram DM (@aurejiclaws), and a "Book a service" button leads to the booking form.

**Contact Us** – Shop details (email, phone, Instagram handle) and a "Book a Service" form. Submitting sends the request to the owner for handling.

**Policies** – Terms & Conditions, Privacy Policy, and Refund Policy pages.

**Admin Dashboard** – Lets the owner edit the hero slideshow, manage press-on products and services, and review customer orders, without touching code. Changes save to the backend and show on the public pages.

### Shared Header and Footer
- **Header:** logo (links Home), navigation (Home, Press-on, Services, Contact), and a cart icon with an item count and dropdown panel, where items can be added or removed.
- **Footer:** brand logo, policy links, location, contact email and phone, business hours, and copyright.

### Checkout Flow
1. **Order Summary** – Review the items and enter delivery details.
2. **Order Payment** – Scan the GCash QR code, then enter the reference number and upload a screenshot of the payment.
3. **Order Confirmation** – The order is placed and marked "Pending Review" while
   the admin verifies the payment. Once the admin approves it, a confirmation
   email is sent to the customer. If the payment can't be verified, the customer
   is emailed that the order was rejected.

## ADMIN

### Overview
The admin area is for the business owner only. There is a single admin account, with email and password set up by the team, and no sign-up page. The dashboard is not linked anywhere on the public site.

### How to Access
1. Add `/admin` to the end of the website's URL (e.g. `https://aurejiclaws-finwebpub-psi.vercel.app/admin`).
2. On the **Admin Portal** page, enter the admin email and password, then click
   **Continue to Verification**.
3. An email titled **"Your Admin Login OTP"** is sent to the admin email only. It
   contains a 6-digit code that expires in 5 minutes.
4. Enter the code in the **Verification code** field and click **Verify & Login**.
5. Once verified, the dashboard opens. The session lasts until the
   admin clicks "Log out."

### What the Admin Can Do
- Edit the hero slideshow images
- Add, edit, or delete press-on products (price, stock, description, status)
- Add, edit, or delete the services menu list
- Update the Instagram gallery and the shop's contact details
- View customer orders, check the GCash payment screenshot, and approve or reject the payment (the customer is emailed the result)
- View booking requests and mark them Confirmed, Completed, or Cancelled (the customer is emailed when confirmed or cancelled)

Changes are saved to the database and show immediately on the public pages.


## BACKEND

## Features

- Product catalog and checkout, with server-side stock and price verification
- GCash-only payment submission with screenshot upload
- Order storage in MongoDB, with admin approve/reject workflow and automatic customer emails
- Admin login protected by password + emailed one-time code (OTP)
- Admin-managed site content: hero slides, Instagram gallery, service menu, contact info
- Admin-managed product catalog (create/update/delete, backed by MongoDB — not localStorage)
- Services booking/appointment flow, with admin status updates and confirmation/cancellation emails
- Secure media uploads for admin-managed images, stored as binary buffers and served through an API route rather than as public files

## Tech stack

| Piece | What we use it for |
|---|---|
| Express | Routing and middleware — handles every request that hits the server |
| MongoDB Atlas + Mongoose + connect-mongo | Stores orders, admins, products, bookings, media, site content, and sessions |
| express-session | Keeps an admin "logged in" between requests, using a secure cookie (`connect.sid`) with a 1-hour expiry (`maxAge: 3600000`) and explicit destruction on logout |
| Multer | Reads uploaded files (checkout's GCash screenshot, admin media uploads) into memory — never written straight to disk/`public/` |
| Nodemailer | Sends the admin's OTP, order approval/rejection emails, and booking confirmation/cancellation emails, via Gmail (`config/email.js`) |

No frontend framework and no template engine (no EJS/React) — every page is a plain `.html` file in `public/`, and any dynamic content is filled in by that page's own client-side JavaScript calling our API routes with `fetch()`. Shared markup (header/footer) is injected into every public page by `components.js`, which loads `header.html`/`footer.html` into `[data-include]` placeholders, highlights the active nav link, and fires a `components:loaded` event once done.

## Project structure

```
aurejiclaws/
├── config/
│   └── email.js                        # nodemailer transporter setup — OTP, order, and booking emails all go through this
├── middleware/
│   └── requireAdminAuth.js             # checks req.session.isAdminAuthenticated; 403s or redirects to login if it's not set — applied to every admin-only route
├── models/
│   ├── Admin.js                        # { email, password } — password is a bcrypt hash, never plain text
│   ├── Booking.js                      # appointment submissions: contact info, service, date/time slot, status, soft-delete flag (isDeleted)
│   ├── MediaAsset.js                   # binary buffer storage for admin-uploaded images
│   ├── Order.js                        # customer info, verified items array, total, GCash payment details, binary payment-proof buffer, status
│   ├── Product.js                      # press-on inventory: productId, name, price, stocks, description
│   └── SiteContent.js                  # hero slides, Instagram gallery, service menu, contact info —
│                                         the data the dashboard's "local-only" panels now actually save to
├── node_modules/
├── public/
│   ├── js/
│   │   ├── admin-bookings.js        # Manages appointment status updates on the dashboard
│   │   ├── admin-orders.js          # Manages order reviews, payment confirmations, and lightboxes
│   │   ├── admin-pages.js           # Central admin requests and client-side image compression helper
│   │   ├── admin.js                 # Dashboard layout and tab management logic
│   │   ├── components.js            # Dynamically injects shared header and footer templates
│   │   ├── login.js                 # Handles admin login form submissions and OTP verification
│   │   ├── public-content.js        # Fetches and renders live data on public pages
│   │   └── script.js                # Manages the global customer shopping cart and checkout modal
│   ├── photos/
│   ├── videos/
│   ├── about.css
│   ├── AboutPage.html
│   ├── admin.css
│   ├── checkout.css
│   ├── contact.css
│   ├── ContactPage.html
│   ├── footer.html
│   ├── header.html
│   ├── HomePage.html
│   ├── login.html
│   ├── nav.css
│   ├── PressonPage.html
│   ├── privacy.css
│   ├── privacy.html
│   ├── refund.html
│   ├── services.css
│   ├── ServicesPage.html
│   ├── style.css
│   └── terms.html
├── routes/
│   ├── bookings.js                # POST /api/bookings, admin list/status-update/soft-delete
│   ├── media.js                   # admin image upload + secure binary serving
│   ├── orders.js                  # checkout, admin order list, approve/reject
│   ├── products.js                # public catalog + admin create/update/delete, auto-seeds defaults
│   └── site-content.js            # load/update hero, Instagram, services, contact sections
├── views/
│   ├── admin/
│   │   ├── booked.html
│   │   ├── HeroPage.html
│   │   ├── orders.html
│   │   ├── post.html
│   │   ├── products.html
│   │   └── servicesList.html
│   └── admin.html                 # the admin dashboard page. Deliberately NOT inside public/ —
│                                     see "Why the admin page isn't in public/" below
├── .env                           # secrets — never committed (see Setup)
├── .gitignore
├── package-lock.json
├── package.json
└── server.js                      # app setup: sessions, admin login/OTP routes, page routes,
                                        DB connection, mounts routes/orders.js, bookings.js, media.js,
                                        products.js, site-content.js
```

## How a request flows through the backend

This is the part most worth walking through together as a team, since it's the shape every feature follows.

**1. A browser asks for something.**
Every request — loading a page, submitting a form, fetching data — arrives at `server.js` first. Express looks through the routes defined there (and in the mounted route files under `routes/`) in order, and the first one that matches handles the request.

**2. Static pages vs. API routes.**
We have two different kinds of routes:
- **Page routes** (e.g. `app.get("/", ...)`) send back a whole `.html` file — these are what you type in the address bar or click a nav link to reach.
- **API routes** (anything under `/api/...` or `/admin/...`) don't return a webpage — they return JSON (data) that a page's own JavaScript fetches in the background and uses to update the page without reloading it. For example, `AdminPage` doesn't come with the order list baked in — `admin-orders.js` calls `GET /api/orders/` after the page loads and builds the order table from what comes back. Same pattern for `GET /api/bookings`, `GET /api/products`, and `GET /api/site-content`.

**3. Middleware runs before the route handler.**
Middleware is code that runs *before* a request reaches its final handler — think of it as a checkpoint. We currently use:
- `express.json()` / `express.urlencoded()` — parses incoming form/JSON data into `req.body` so routes can read it
- `express.static(publicDir)` — serves anything in `public/` directly, no route needed
- `session(...)` — reads/writes the session cookie, which is how the server remembers an admin is logged in between requests
- `requireAdminAuth` (`middleware/requireAdminAuth.js`) — checks `req.session.isAdminAuthenticated` and blocks the request with a 403 (or redirects to login) if it's not set. Applied to `GET /admin` and every admin-only API route (orders, bookings, media, products, site-content management).
- `multer` (memory storage) — on upload routes only (`place-order`, admin media upload), reads the file into a buffer in memory instead of writing it to disk

## Admin login flow (password + OTP)

This replaced an earlier prototype where the OTP was generated and shown directly in the browser — insecure, since anyone could read it from the page. The real flow is entirely server-side:

1. **`POST /admin/login`** — admin submits email + password from login.html. The server looks up the Admin document in MongoDB and checks the password directly. If it matches, the server generates a random 6-digit code, saves it to req.session (server-side, not sent to the browser) along with a 5-minute expiry, and emails it to the admin via config/email.js.
2. **`POST /admin/verify-otp`** — admin submits the code they received by email. The server compares it against what's stored in the session (not what the browser claims). If it matches and hasn't expired, `req.session.isAdminAuthenticated` is set to `true`.
3. **`GET /admin`** — now that the session is authenticated, `requireAdminAuth` lets the request through and serves `views/temporary-admin.html`.

### Why the admin page isn't in `public/`

`express.static` serves *everything* inside `public/` to *anyone*, with no login check — that's what static file serving means. If the admin dashboard lived there, anyone could open it directly, bypassing login entirely. Keeping it in `views/` means the **only** way to receive that file is through the `GET /admin` route, which runs `requireAdminAuth` first.

> `SESSION_SECRET` still falls back to a hardcoded default if `.env` doesn't set one — fine for local dev, but must be set for any real deployment.

`temporary-admin.html` used to contain its own client-side login gate, separate from and in addition to the real server-side one — a `handlePortalAuth()` function (in `admin.js`) that checked a hardcoded `admin`/`admin123` against no server at all, with the password shown in plain text on the page ("Test mode: username: admin | password: admin123"). That's been removed. The dashboard now renders directly once `GET /admin` lets the request through — there's exactly one login flow (`login.html` → `/admin/login` → emailed OTP → `/admin/verify-otp`), and "Log out" calls a real `POST /admin/logout` route that destroys the session server-side, instead of only clearing a browser-side flag.

## Order flow

1. **Customer checks out** (any page's cart, driven by the global `public/js/script.js`): adds items to an in-page cart (held in a plain JS variable, not saved anywhere until checkout), then a 3-step modal collects delivery details + consent, then GCash payment info (reference number, date/time sent) + a screenshot. On submit, everything — form fields and the image file — goes to the server in one `multipart/form-data` request.
2. **`POST /api/orders/place-order`** (in `routes/orders.js`) handles it:
   - `multer` reads the uploaded screenshot into memory (never written to disk/`public/`, since that would expose it publicly)
   - the file's actual bytes are checked against its claimed type (`imageContentType`), to catch a disguised file
   - every cart item is re-validated against the server's own product data (from `Product` in MongoDB, not whatever price/stock the browser sent) — stock is decremented atomically at this point, so two customers can't both buy the last unit
   - a new `Order` document is saved to MongoDB with `status: "Pending Review"`
3. **Admin reviews orders** on the dashboard (`admin-orders.js`), which calls `GET /api/orders/` to list everything, newest first, with status badges and a compact payment-proof thumbnail per order. Clicking a thumbnail opens a full-screen lightbox so the admin can check the screenshot against the claimed GCash reference number without the broken base64-tab-redirect behavior an earlier version had.
4. **Admin approves or rejects a payment**, each behind a `confirm()` dialog:
   - `POST /api/orders/approve/:id` → sets `status: "Approved"`, emails the customer a confirmation
   - `POST /api/orders/reject/:id` → sets `status: "Rejected"`, emails the customer that the payment couldn't be verified

> Both `GET /api/orders/` and the approve/reject routes require `requireAdminAuth`. `POST /api/orders/place-order` is intentionally left open, since that's the public customer checkout endpoint.

## Booking / Services flow

- **`POST /api/bookings`** (public) — customer submits name, email, contact, `serviceId`/`serviceType`, a `dateSchedule` (validated `YYYY-MM-DD`), and a `timeSlot` (validated `HH:MM`). Saved as `status: "Pending"`.
- **`GET /api/bookings`** (admin) — lists bookings for the dashboard's Services panel.
- **`POST /api/bookings/status/:id`** (admin) — moves a booking through `Pending` → `Confirmed`/`Completed`/`Cancelled`; confirming or cancelling sends the customer an automatic email, same pattern as order approval/rejection.
- **`DELETE /api/bookings/:id`** (admin) — soft delete: sets `isDeleted` rather than removing the document, so a cancelled/old booking can still be audited later.

## Media uploads (admin-managed images)

Separate from the customer-facing payment screenshot, `routes/media.js` lets an admin upload images for site content (hero slides, Instagram gallery) directly from the dashboard:

- **`POST /api/media`** (admin) — accepts an image up to 4MB, checks its declared MIME type, and verifies the actual file bytes before storing it as a binary buffer via `MediaAsset` — same "don't trust the upload" logic as the payment-proof check in `orders.js`.
- **`GET /api/media/:id`** (public) — serves the stored image back out, decoded from the database. Nothing uploaded through this route is ever written into `public/` as a static file, so there's no way to browse or guess at uploaded media by URL the way you could with a public folder.

## Site content & product catalog (admin-managed)

- **`routes/site-content.js`** — `SiteContent` holds the hero slides, Instagram gallery slots, service menu categories/items, and business contact info shown on the public pages. The dashboard's Hero, Instagram, and Services/Contact panels now read and write this through the API, instead of only saving to `localStorage` the way they used to.
- **`routes/products.js`** — auto-seeds a default product catalog if the `Product` collection is empty, serves it publicly via `GET /api/products`, and lets an authenticated admin `PUT /api/products/:productId` (update) or `DELETE /api/products/:productId`. The checkout flow and the dashboard's Products panel now read from the same source of truth, so editing a price or stock count in the dashboard actually changes what customers see and can buy.

Worth knowing: there's still an unused `BroadcastChannel('aureji_claws_sync_channel')` in `admin.js`, originally set up to sync dashboard state across multiple open tabs of the same browser — it listens for a `'NEW_ORDER'` message nothing currently sends. Now that Orders/Bookings/Products/Site Content all come from the server via `fetch()` rather than `localStorage`, each tab just re-fetches on load, so this has no practical effect either way; it's dead code rather than a bug.

## API reference

| Method | Route | What it does | Requires admin login? |
|---|---|---|---|
| GET | `/`, `/AboutPage.html`, `/PressonPage.html`, `/ServicesPage.html`, `/ContactPage.html` | Serve the matching page | No |
| POST | /admin/login | Check email/password directly, email an OTP | No |
| POST | `/admin/verify-otp` | Verify the OTP, start the admin session | No |
| POST | `/admin/logout` | Destroy the admin session | Yes |
| GET | `/admin` | Serve the admin dashboard | Yes |
| POST | `/api/orders/place-order` | Customer submits an order + payment screenshot; stock decremented atomically | No |
| GET | `/api/orders/` | List all orders (for the dashboard) | Yes |
| POST | `/api/orders/approve/:id` | Approve an order's payment, email the customer | Yes |
| POST | `/api/orders/reject/:id` | Reject an order's payment, email the customer | Yes |
| POST | `/api/bookings` | Customer submits an appointment request | No |
| GET | `/api/bookings` | List bookings (for the dashboard's Services panel) | Yes |
| POST | `/api/bookings/status/:id` | Update a booking's status, email the customer if confirmed/cancelled | Yes |
| DELETE | `/api/bookings/:id` | Soft-delete a booking (`isDeleted: true`) | Yes |
| GET | `/api/products` | Public product catalog | No |
| PUT | `/api/products/:productId` | Update a product | Yes |
| DELETE | `/api/products/:productId` | Delete a product | Yes |
| POST | `/api/media` | Upload an admin-managed image (4MB limit, type-checked) | Yes |
| GET | `/api/media/:id` | Serve a stored image back out | No |
| GET | `/api/site-content` | Load hero/Instagram/services/contact content | No |
| PUT | `/api/site-content` | Update hero/Instagram/services/contact content | Yes |
| GET | `/api/health` | Returns whether MongoDB is currently connected | No |

## Data models

**`Admin`**: `email` (unique), `password` (verified directly against plain text input in server.js).

**`Order`**
```
customer: { fullName, email, contactNo, address, notes, consentGiven }
items: [{ productId, productName, unitPrice, quantity (1–10) }]
totalAmount
payment: {
  method ("GCash" only), referenceNumber, dateSent, timeSent, notes,
  proof: { data (binary), contentType }
}
status: "Pending Review" | "Approved" | "Rejected"  (default: "Pending Review")
createdAt / updatedAt
```
Both the `"Approved"` and `"Rejected"` transitions are live — `routes/orders.js` has routes for each, and product stock is decremented atomically at order-placement time rather than at approval, to prevent overselling between checkout and review.

**`Product`**: `productId` (unique), `productName`, `price`, `stocks`, `description`. Wired end-to-end: `routes/products.js` auto-seeds defaults, serves the public catalog, and lets an admin update/delete; checkout and the dashboard both read from this collection.

**`Booking`**: `name`, `email`, `contact`, `serviceId`, `serviceType`, `dateSchedule` (validated `YYYY-MM-DD`), `timeSlot` (validated `HH:MM`), `status` (`Pending` / `Confirmed` / `Completed` / `Cancelled`, default `Pending`), `remarks`, `isDeleted` (soft-delete flag). Fully wired via `routes/bookings.js`.

**`MediaAsset`**: binary buffer + content type for an admin-uploaded image, served back out through `GET /api/media/:id` rather than as a static file.

**`SiteContent`**: hero slides, Instagram gallery slots, service menu categories/items, and business contact info — the single source of truth the dashboard's Hero/Instagram/Services/Contact panels read from and write to.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:
   ```
   MONGO_URI=your_mongodb_connection_string
   MONGO_DB_NAME=aureji_claws
   EMAIL_USER=your_email_address
   EMAIL_PASS=your_email_app_password
   SESSION_SECRET=your_session_secret
   PORT=3000
   ```
   - `MONGO_URI` / `MONGO_DB_NAME` — needed to save and retrieve orders, admins, products, bookings, media, and site content
   - `EMAIL_USER` / `EMAIL_PASS` — needed to send OTP, order approval/rejection, and booking confirmation/cancellation emails. This must be a Gmail account, and `EMAIL_PASS` must be a [Gmail app password](https://myaccount.google.com/apppasswords), not the account's normal login password — Google blocks this kind of login otherwise. Each team member testing locally needs their own app password if using their own Gmail account.
   - `SESSION_SECRET` — used to sign the admin's session cookie; use a long random string, not the placeholder

3. Start the server:
   ```bash
   npm start
   ```

4. Open `http://localhost:3000`
