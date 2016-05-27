FROM nginx:alpine
MAINTAINER Ben Booth <bkbooth@gmail.com>

# Copy nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Setup application directory
ENV APP_DIR /usr/share/nginx/html
WORKDIR ${APP_DIR}
VOLUME ${APP_DIR}

# Copy all application files
COPY . ${APP_DIR}
