#!/bin/sh
set -e

setup_directories() {
    mkdir -p /var/www/html/storage/logs
    mkdir -p /var/www/html/storage/framework/cache
    mkdir -p /var/www/html/storage/framework/data
    mkdir -p /var/www/html/storage/framework/sessions
    mkdir -p /var/www/html/storage/framework/testing
    mkdir -p /var/www/html/storage/framework/views
}

install_dependencies() {
    VENDOR_AUTOLOAD="/var/www/html/vendor/autoload.php"
    HASH_FILE="/var/www/html/vendor/.composer.lock.hash"

    if [ "$APP_ENV" = "production" ]; then
        if [ -f "$VENDOR_AUTOLOAD" ]; then
            return 0
        fi

        composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
        return 0
    fi

    if [ ! -f /var/www/html/composer.lock ]; then
        echo "composer.lock not found; skipping dependency install."
        return 0
    fi

    CURRENT_HASH=$(sha256sum /var/www/html/composer.lock | awk '{print $1}')
    INSTALLED_HASH=""
    if [ -f "$HASH_FILE" ]; then
        INSTALLED_HASH=$(cat "$HASH_FILE")
    fi

    if [ -f "$VENDOR_AUTOLOAD" ] && [ "$CURRENT_HASH" = "$INSTALLED_HASH" ]; then
        return 0
    fi

    composer install --no-interaction --prefer-dist
    echo "$CURRENT_HASH" > "$HASH_FILE"
}

run_migrations() {
    if [ "${RUN_MIGRATIONS:-true}" != "true" ]; then
        return 0
    fi

    until php artisan migrate --force --no-interaction; do
        echo "Waiting for database connection..."
        sleep 2
    done
}

set_permissions() {
    chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
}

setup_directories
set_permissions
install_dependencies
run_migrations

exec "$@"
