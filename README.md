# Mini Database

Home page with an **Add name** button. It opens a form (name = text, age = number). Submitting creates a profile, stored by the Node.js backend.

## Run locally
```bash
npm start        # needs Node 18+, no npm install required
# open http://localhost:3000
```

## API
| Method | Path | Description |
|---|---|---|
| GET | `/api/profiles` | List all profiles |
| POST | `/api/profiles` | Create `{ "name": "...", "age": 25 }` |
| DELETE | `/api/profiles/:id` | Delete a profile |

## Deploy (GitHub + Render)
GitHub Pages can only host static files, so it can't run the backend. Push this repo to GitHub, then deploy it as a Web Service:

1. Push to GitHub.
2. On https://render.com → **New → Web Service** → connect the repo.
3. Build command: *(leave empty)* · Start command: `npm start`.
4. Deploy. (Railway, Fly.io and Koyeb work the same way.)

Note: data is saved in `data/db.json`. On free hosts the disk resets on redeploy; for permanent storage attach a persistent disk (set `DATA_DIR` to its mount path) or switch to a hosted database.
