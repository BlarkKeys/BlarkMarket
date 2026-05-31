# blarkkeys Beatstore

A local Java-hosted beatstore for blarkkeys, with:

- storefront categories for beats/instrumentals and samples/loops
- hip hop, RnB, trapsoul, lofi, and trap catalog metadata
- modern customer-only public store
- separate owner studio at `/studio.html`
- live animated visual system and premium typography
- owner-only studio upload and unpublish flow
- automatic license file generation for every upload
- processor-ready checkout flow for PayPal or bank-card providers
- global currency display for customer convenience

## Run

```powershell
javac src\App.java
java -cp src App
```

Open the URL printed in the terminal. By default it is `http://localhost:4173`.

If port `4173` is already busy because another copy is running, the app will automatically try the next available local port, such as `http://localhost:4174`.

The local admin demo PIN is `0000`.

## Pages

- Public website: `http://localhost:4173/`
- Owner studio: `http://localhost:4173/studio.html`

The public website starts empty. Upload content in the studio to publish it live on the customer website. Generated licenses and owner management links stay in the studio.

## Deploy

Recommended first host: Render or Railway. Both can deploy this project from GitHub using the included `Dockerfile`.

### 1. Put the project on GitHub

Create a new GitHub repository, then push this folder to it.

```powershell
git init
git add .
git commit -m "Deploy blarkkeys beatstore"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/blarkkeys-beatstore.git
git push -u origin main
```

### 2. Deploy on Render

1. Create a Render account.
2. Choose **New Web Service**.
3. Connect the GitHub repository.
4. Render will use the included `Dockerfile`.
5. Set the service type to web service.
6. Deploy.

The app reads the host-provided `PORT` environment variable automatically.

### 3. Deploy on Railway

1. Create a Railway account.
2. Choose **Deploy from GitHub repo**.
3. Select this repository.
4. Railway will detect the `Dockerfile`.
5. Deploy and open the generated public domain.

### 4. Important production upgrade

Uploads are currently stored in the app's local `storage/` folder. On many cloud hosts, local files can disappear on redeploy. Before selling beats publicly, move uploads and licenses to persistent storage such as:

- Render persistent disk
- Railway volume
- Amazon S3
- Cloudflare R2
- Supabase Storage

Also replace the demo admin PIN with real login/authentication before you share the site publicly.

## Payments and banking

This app does not store customer card or bank details. For a live website, connect PayPal Checkout and a PCI-compliant processor such as Stripe, Paystack, Flutterwave, Adyen, or your bank's hosted payment page. That keeps sensitive financial data off your server while payouts can still go to your bank account or PayPal account.

## Storage

Runtime data is written to `storage/`:

- `storage/catalog.json`
- `storage/uploads/`
- `storage/licenses/`

Replace the generated license text with lawyer-approved terms before selling live content.
