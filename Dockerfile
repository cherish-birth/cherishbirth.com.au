FROM mhart/alpine-node
MAINTAINER Ben Booth <bkbooth@gmail.com>

EXPOSE 8000

# Setup application directory
ENV APP_DIR /usr/src/app
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}
VOLUME ${APP_DIR}

# Copy all application files
COPY . ${APP_DIR}

# Install node dependencies
RUN npm install --quiet && \
    npm cache clear

# Run with nodemon
CMD npm start
