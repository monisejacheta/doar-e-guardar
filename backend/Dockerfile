FROM node:20-slim

ENV NODE_ENV=production
ENV PORT=7860

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 7860

CMD ["npm", "start"]
