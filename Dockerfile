FROM node:24-bookworm

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY server.js ./
COPY students.txt ./
COPY c_core ./c_core
COPY public ./public

EXPOSE 3000

CMD ["node", "server.js"]
