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
    if [ -f "/var/www/html/vendor/autoload.php" ]; then
        return 0
    fi

    if [ "$APP_ENV" = "production" ]; then
        composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
    else
        composer install --no-interaction --prefer-dist
    fi
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

setup_directories
install_dependencies
run_migrations

exec "$@"
