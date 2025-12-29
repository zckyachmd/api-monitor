# syntax=docker/dockerfile:1.7

ARG PHP_VERSION=8.2
ARG NODE_VERSION=20

FROM php:${PHP_VERSION}-cli AS php-base

ENV TZ=UTC

RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        libicu-dev \
        libonig-dev \
        libxml2-dev \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        gd \
        intl \
        pcntl \
        pdo_mysql \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

FROM php-base AS composer-deps

ARG APP_ENV=production
ENV APP_ENV=${APP_ENV}

COPY composer.json composer.lock ./
RUN if [ "$APP_ENV" = "production" ]; then \
        composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts; \
    else \
        composer install --no-interaction --prefer-dist --no-scripts; \
    fi

FROM node:${NODE_VERSION}-bookworm AS asset-builder

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    else npm install; \
    fi

COPY resources ./resources
COPY vite.config.js tsconfig.json* ./
COPY public ./public
COPY .env.example ./.env

RUN npm run build

FROM php-base AS runtime

ARG APP_ENV=production
ENV APP_ENV=${APP_ENV}

COPY . .
COPY --from=composer-deps /var/www/html/vendor ./vendor
COPY --from=asset-builder /app/public/build ./public/build

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8000 8080 5173

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
