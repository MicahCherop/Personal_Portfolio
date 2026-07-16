# Deploying Joseph Micah's Portfolio with Supabase + GitHub Pages

Follow these steps in order. Takes about 15 minutes.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `jmicah-portfolio`) and a strong database password
3. Pick the **East Africa (AWS ap-southeast-1)** region for lowest latency
4. Wait ~2 minutes for the project to spin up

---

## 2. Run the database schema

1. In your Supabase project → **SQL Editor** → **New query**
2. Open `supabase-setup.sql` from this folder, paste the entire contents, click **Run**
3. You should see "Success. No rows returned" — the tables and seed data are created

---

## 3. Get your API keys

In the Supabase dashboard → **Settings** → **API**:

| Value | Where to copy from |
|---|---|
| **Project URL** | "Project URL" field |
| **Anon / public key** | "Project API keys → anon public" |

Open `data.js` and replace the two placeholder lines near the top:

```js
const SUPABASE_URL  = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJ...your-anon-key...';
```

> **Important:** The anon key is safe to commit — it's public by design.
> Row-level security restricts writes to authenticated users only.

---

## 4. Create your admin user

1. Supabase dashboard → **Authentication** → **Users** → **Add user**
2. Enter your email and a strong password
3. That's the email + password you'll use to log in to `admin.html`

---

## 5. (Optional) Set up Supabase Storage for images

If you want to upload photos and project images through the admin (instead of pasting URLs):

1. Supabase dashboard → **Storage** → **New bucket**
2. Create three buckets: `photos`, `resumes`, `project-images`
3. For each bucket: **Policies** → **New policy** → "Allow public reads" (SELECT for anon)
4. Add an authenticated-user write policy (INSERT/UPDATE/DELETE for authenticated role)

If you skip this step, the admin falls back to storing images as base64 strings in the database — fine for small images, but URL-hosted images are faster.

---

## 6. Enable Realtime (so edits appear live)

1. Supabase dashboard → **Database** → **Replication**
2. Under "Source", make sure **all five tables** are toggled on:
   - `profile`, `projects`, `experience`, `education`, `skills`, `testimonials`

---

## 7. Push to GitHub

```bash
git init
git add .
git commit -m "Initial portfolio with Supabase backend"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

---

## 8. Enable GitHub Pages

1. Your repo → **Settings** → **Pages**
2. Source: **Deploy from a branch** → Branch: `main` → Folder: `/ (root)`
3. Click **Save** — your site will be live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`

> **Custom domain:** Add a `CNAME` file to the repo root containing your domain name (e.g. `jmicah.dev`), then configure your DNS with your registrar.

---

## 9. Allow your domain in Supabase

So the browser doesn't get CORS errors on the live site:

1. Supabase → **Authentication** → **URL Configuration**
2. Add your GitHub Pages URL to **Site URL** (e.g. `https://MicahCherop.github.io/portfolio`)
3. Also add it to **Redirect URLs** if you use magic links

---

## Daily workflow

- **Edit content:** go to `yoursite.com/admin.html`, log in, make changes — they appear on the public site within seconds (no redeploy needed)
- **Add/remove projects:** Admin → Projects tab → `+ Add project` or `Delete`
- **Backup:** Admin → Settings → Export data (.json)

---

## File structure

```
portfolio/
├── index.html          Public portfolio page
├── admin.html          Admin dashboard (password-protected)
├── style.css           Theme tokens + global styles
├── data.js             Supabase client + shared utilities
├── main.js             Public page rendering + realtime
├── admin.js            Admin CRUD + PDF resume parsing
├── supabase-setup.sql  Run once in Supabase SQL Editor
├── Cherop.png          Default profile photo (replace with yours)
└── SETUP.md            This file
```