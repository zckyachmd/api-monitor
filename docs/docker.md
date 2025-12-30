# Docker Guide

This repository ships with a multi-container setup that runs the Laravel HTTP server, queue worker, scheduler loop, Reverb WebSocket server, the Vite dev server (with hot reload), and the required backing services (MySQL + Redis).

## Requirements

- Docker Engine 24+ with the Compose plugin (`docker compose version`).
- `.env` file (copy from `.env.example`) with the usual APP/DB/UPTIME_KUMA/REVERB variables.

## Development workflow

1. Build and start the stack (first run builds images, installs Composer deps, and runs pending migrations inside the `app` container):

   ```bash
   APP_PORT=8000 docker compose up --build
   ```

   Containers:
   - `app`: `php artisan serve`
   - `scheduler`: `php artisan schedule:work`
   - `queue`: `php artisan queue:work --queue=kuma,default`
   - `reverb`: `php artisan reverb:start --host=0.0.0.0 --port=8080`
   - `vite`: `npm run dev -- --host=0.0.0.0 --port=5173 --strictPort`
   - `mysql` / `redis` (redis 7-alpine)

2. Persistent volumes keep dependencies between runs:
   - `laravel_vendor` (Composer `vendor/`)
   - `laravel_storage` (Laravel `storage/`)
   - `node_modules` (frontend deps)
   - `mysql_data`, `redis_data`

3. Dev hot reload: Vite runs in its own container with polling enabled (`CHOKIDAR_USEPOLLING=true`) and exposes the dev server with HMR over `localhost:5173` via the `VITE_HMR_HOST` env var, so editing JS/TS/React files on the host immediately refreshes the browser.

4. Need to re-run migrations manually? The entrypoint retries `php artisan migrate --force --no-interaction` until MySQL is reachable. To opt out (for example, when you manage migrations externally) set `RUN_MIGRATIONS=false` on the affected service.

5. Run framework commands through the app container:

   ```bash
   docker compose exec app php artisan migrate
   docker compose exec app php artisan kuma:fetch
   docker compose exec app ./vendor/bin/pest
   docker compose exec vite npm run build    # Manual asset build if needed
   ```

6. Tail logs:

   ```bash
   docker compose logs -f app queue scheduler reverb
   ```

7. Stop everything:

   ```bash
   docker compose down            # keep volumes
   docker compose down -v         # destroy MySQL/Redis/vendor/node_modules volumes too
   ```

### Default ports

| Service | Container | Host port |
| ------- | --------- | --------- |
| HTTP (dev) | app       | `${APP_PORT:-8000}` |
| HTTP (prod) | nginx    | `${APP_PORT:-8000}` |
| Reverb  | reverb    | `8080` |
| Vite dev server | vite      | `5173` |
| MySQL   | mysql     | `3306` |
| Redis   | redis     | `6379` |

## Production override

`docker-compose.prod.yml` defines the standalone production stack (different env vars, image tag `api-monitor-app:prod`, no source-code bind mount, nginx front-end). Run it on its own:

```bash
APP_URL=https://monitor.example.com \
DB_DATABASE=api_monitor \
DB_USERNAME=api_monitor \
DB_PASSWORD=supersecret \
docker compose -f docker-compose.prod.yml up --build -d
```

Key behavior:

- PHP services build with `APP_ENV=production`, run PHP-FPM, and tag `api-monitor-app:prod`.
- An `nginx:alpine` front-end container (via the multi-stage target) serves `/public` and proxies PHP traffic to `app:9000`.
- Only `storage/` is mounted (shared with nginx so `/storage` URLs work); code lives inside the image and the build stage removes any stray `public/hot` file so Vite never tries to talk to a dev server.
- `mysql:8.4` and `redis:7-alpine` run without host ports; only nginx exposes `${APP_PORT:-8000}`.
- Prod uses its own volumes (`laravel_storage_prod`, `mysql_data_prod`, `redis_data_prod`) so dev/test data does not leak across runs.
- Cache/session drivers default to Redis in prod, so no DB tables are required for cache/session storage.
- A fallback `APP_KEY` is baked into the compose file for convenience, but you should override it with your own generated key via `APP_KEY=base64:...` when running the stack.
- Background workers match the dev setup: `scheduler` runs `php artisan schedule:work`, `queue` runs `php artisan queue:work ...`, and `reverb` starts the websocket server. All of them share the same storage volume so logs persist.
- `VITE_REVERB_ENABLED=false` and the Vite dev server stays disabled.

To run migrations or artisan tasks against the production stack:

```bash
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
```

> Changing DB credentials or starting the prod stack for the first time? Because the database lives inside `mysql_data_prod`, run `docker compose -f docker-compose.prod.yml down -v` once (or `docker volume rm api-monitor_mysql_data_prod`) to reset the volume so MySQL can initialize with the new password/key pair. Do the same if you change `APP_KEY`.

## Troubleshooting

- Run `docker compose build --no-cache app` to force a clean image rebuild.
- `docker compose ps` shows container health; use `docker compose logs <service>` for details.
- Ensure `.env` matches the container DB credentials (`DB_HOST=mysql`, `DB_PASSWORD=secret` by default).
- Generate an `APP_KEY` once (e.g. run `php artisan key:generate --show` or `php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"`) and pass it via the environment when launching the stack.
