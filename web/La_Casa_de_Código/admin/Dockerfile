FROM node:20-alpine

WORKDIR /app

COPY app/package.json app/package-lock.json* ./
RUN npm install --production

COPY app/ ./
COPY flag.txt /app/flag.txt

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]
