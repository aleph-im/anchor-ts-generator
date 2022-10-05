FROM node:16-alpine
WORKDIR /app

ARG INDEXER
ENV INDEXER=$INDEXER

COPY ./packages/$INDEXER .
RUN npm ci

RUN npm run build

EXPOSE 8080
ENV NODE_ENV=production

CMD ["./cmd.sh"]
