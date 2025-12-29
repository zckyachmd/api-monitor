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

`docker-compose.prod.yml` acts as the override file for production deployments (different env vars, image tag `api-monitor-app:prod`, no source-code bind mount, nginx front-end). Run it alongside the base file:

```bash
APP_URL=https://monitor.example.com \
DB_DATABASE=api_monitor \
DB_USERNAME=api_monitor \
DB_PASSWORD=supersecret \
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Key behavior:

- PHP services build with `APP_ENV=production`, run PHP-FPM, and tag `api-monitor-app:prod`.
- An `nginx:alpine` front-end container (via the multi-stage target) serves `/public` and proxies PHP traffic to `app:9000`.
- Only `storage/` is mounted (shared with nginx so `/storage` URLs work); code lives inside the image.
- `redis:7-alpine` and MySQL run without host ports; only nginx exposes `${APP_PORT:-8000}`.
- `VITE_REVERB_ENABLED=false` and the Vite dev server stays disabled.

To run migrations or artisan tasks against the production stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec app php artisan migrate --force
```

## Troubleshooting

- Run `docker compose build --no-cache app` to force a clean image rebuild.
- `docker compose ps` shows container health; use `docker compose logs <service>` for details.
- Ensure `.env` matches the container DB credentials (`DB_HOST=mysql`, `DB_PASSWORD=secret` by default).
