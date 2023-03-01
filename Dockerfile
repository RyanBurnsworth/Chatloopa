# Stage 1
FROM node:14.15.4 as node
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --prod
# Stage 2
FROM nginx:alpine
COPY --from=node /app/dist/webrtc-project /usr/share/nginx/html

# Stage 1
FROM node:14.15.4 as node
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --prod
# Stage 2
FROM nginx:alpine
 
COPY nginx.conf /etc/nginx/nginx.conf
RUN apk update && apk add bash
openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
  -keyout chatloopa.key -out chatloopa.crt -subj "/CN=chatloopa.com" \
  -addext "subjectAltName=DNS:chatloopa.com,IP:172.105.153.56"