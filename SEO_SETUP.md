# SEO_SETUP.md — Shirt Société

Manual steps the site owner performs. Everything in this document happens in
Google's interfaces, not in the codebase.

Keep this file in the repository root so it stays with the project.

---

## 1. Order of operations after any product change

The site, the Merchant feed and the structured data all read from the same
Supabase fields. When shirts change, regenerate in this order:

1. **Check data** — fix every `[error]` before continuing. Warnings can wait.
2. **Generate product pages** → upload the `products/` folder.
3. **Generate collections** → upload `collections/`, `clubs/`, `national-teams/`.
4. **Generate journal** → upload `journal/` (only when articles changed).
5. **Generate sitemap** → upload `sitemap.xml`.
6. **Generate Merchant feed** → upload `products.xml`.
7. Resubmit the sitemap in Search Console.

Skipping step 1 is how contradictions reach the live site.

---

## 2. Google Search Console

### Domain Property
Use a Domain Property, not a URL-prefix property, so every variant of the
domain is covered.

1. search.google.com/search-console → property selector → **Add property**
2. Choose **Domain** and enter `shirtsociete.com`
3. Google returns a TXT record → add it in the DNS panel at the domain registrar
4. Verification usually completes within an hour

Do not paste verification tokens into the repository.

### Sitemap submission
1. Search Console → **Sitemaps**
2. Submit `sitemap.xml`
3. Resubmit after every regeneration
4. Confirm the reported URL count roughly matches the number of live pages

### URL Inspection
Use for individual pages, especially new products and new landing pages.

1. Paste the full URL in the top search bar
2. Read **Page indexing** → note the **Google-selected canonical**
3. If Google picked a different canonical than the page declares, that is a
   duplicate-content signal worth investigating
4. **Request indexing** for genuinely important new pages only

Requesting indexing for dozens of pages at once does not speed anything up.

### Page Indexing report
Check weekly. Expected categories:

- **Not found (404)** — real problem; usually means pages were renamed or a
  folder was not uploaded
- **Crawled – currently not indexed** — normal for a young shop with many
  similar pages; resolves over time
- **Alternate page with proper canonical tag** — normal, no action
- **Page with redirect** — normal for `/beurs.html`

### Merchant Listings and Product Snippets reports
Both appear under **Shopping** once product structured data is detected.
They report schema errors separately from Merchant Center. Fix errors here
before assuming the feed itself is wrong.

### Core Web Vitals
Under **Experience → Core Web Vitals**. Check the mobile tab. Product photography
is commercially important and should not be degraded to chase a score; treat
layout shift and slow largest-image loading as the real issues.

---

## 3. Google Merchant Center

### Feed source
The feed lives at `https://shirtsociete.com/products.xml` and is generated from
the same product data as the website.

Preferred setup: **Settings → Data sources → Add product source → "Add products
from a file" → "Provide a link to the file"** with that URL. Google then fetches
it every 24 hours automatically.

If the existing source is type "File (manual)", it cannot be converted; create a
new URL-based source and delete the manual one once the new source imports
successfully.

### Rules that must hold
- Price, availability, size and condition in the feed must match the product page
- Vintage and match worn shirts are submitted as **used**
- No GTIN or MPN is invented. `identifier_exists` is set to `no`, except where a
  genuine manufacturer product code exists
- Sold shirts must leave active availability immediately — regenerate and upload
  the feed the same day a shirt sells

### Shipping and returns
Configured in Merchant Center under **Shipping and returns**, and mirrored in
the product structured data:

- Netherlands: €3.95 flat, free above €150
- Selling countries: Netherlands, Belgium, Germany, France
- Returns: 14 days, return by mail, customer pays return shipping

If any of these change, update `shipping.html`, `refund.html`, the Merchant
Center settings and the schema values together.

---

## 4. Google Analytics 4

Ecommerce events are implemented behind cookie consent: `view_item`,
`add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `purchase`.

To connect Search Console data to GA4:

1. GA4 → **Admin** → **Product links** → **Search Console links** → Link
2. Choose the property and the web stream
3. GA4 → **Admin** → **Reporting settings** → **Library** → find the
   *Search Console* collection → **Publish**

Step 3 is easy to miss; without it the reports exist but stay hidden.

Verify after a few days that GA4 purchase counts match real orders. If they
diverge, check whether the payment provider returns failed payments to the same
URL as successful ones.

---

## 5. What is deliberately not indexed

`robots.txt` blocks crawling of application states that would otherwise create
near-duplicate pages:

- sort, size, condition, price and search parameters
- `?p=cart`, `?p=checkout`, `?p=profile`, `?p=wishlist`
- `?add=`, `?ssr=`
- `/admin.html`

Query-string shop URLs (`/?p=shop&cat=...`) are no longer listed in the sitemap
because `/collections/...` covers the same listings as real URLs.

---

## 6. Weekly routine (about 10 minutes)

- **Performance** — which queries are growing, what the click-through rate is
- **Page indexing** — is the 404 count falling
- **Merchant Center → Products → Needs attention** — anything newly disapproved
- **Core Web Vitals** — any new mobile issues

Act on trends, not on single days.

---

## 7. One-time setup for the Sell Your Shirt upload form

Photos submitted through `/sell-your-shirt.html` upload straight to Cloudinary.
Create the preset once:

1. Cloudinary → **Settings** → **Upload** → **Upload presets** → *Add upload preset*
2. Name it exactly `shirt_submissions`
3. Signing mode: **Unsigned**
4. Folder: `shirt-submissions`
5. Under *Upload control*, restrict allowed formats to `jpg, png, webp, heic`
   and set a max file size of 10 MB
6. Save

Cloudinary assigns a random public ID to every upload, so the folder cannot be
browsed or guessed from outside. The upload URLs arrive by email with each
submission.

If the preset does not exist, the form still submits — the photos simply fail
and the sender is told to reply to the confirmation email with images instead.

---

## 8. One-time setup for the Want List

Run once in the Supabase SQL editor:

```sql
create table if not exists want_list (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email text not null,
  name text,
  club text,
  player text,
  season_text text,
  season_from int,
  season_to int,
  size text,
  budget_text text,
  budget_max numeric,
  match_worn_pref text,
  notes text,
  status text default 'open'
);

alter table want_list enable row level security;

-- the public page may only add a request, never read or change anything
create policy "public can insert want list"
  on want_list for insert
  to anon
  with check (true);
```

The admin reads this table with the same anon key, so also add:

```sql
create policy "read want list"
  on want_list for select
  to anon
  using (true);
```

If you would rather the requests not be publicly readable, drop that second
policy and read the table from the Supabase dashboard instead — the admin
button will then report that it cannot load the list.

### Using it
Admin → **Want list**. Every open request is scored against current stock:
club is required, then player, era, size, budget and match-worn preference add
to the score. Nothing is emailed automatically; you decide who to contact.

Set `status` to `matched` or `closed` in Supabase once a request is handled, so
it drops out of the report.
