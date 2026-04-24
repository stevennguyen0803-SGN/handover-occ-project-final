FROM node:20-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package-lock.json ./frontend/
COPY backend/package.json backend/package-lock.json ./backend/

RUN npm ci \
  && npm --prefix frontend ci \
  && npm --prefix backend ci

COPY . .

RUN npm run db:generate \
  && npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
