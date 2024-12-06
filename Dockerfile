FROM node:20.18.1-bullseye-slim as builder

WORKDIR /build

# yarn workspaceでの依存関係を解決するために package.json, yarn.lock をコピー
# ソースコードなどをコンテナー内にコピー
COPY . .
# 依存ライブラリをインストール
RUN yarn install --pure-lockfile --non-interactive

RUN yarn prisma-generate
# backend 用のソースコードをビルド
# WORKDIR /build/apps/backend
RUN yarn build-all

# -----------------------------
FROM node:20.18.1-bullseye-slim

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.7.0 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT 3000
ENV READINESS_CHECK_PATH /health-check

WORKDIR /app

COPY --from=builder /build/node_modules node_modules 
COPY --from=builder /build/apps/backend/dist dist
COPY --from=builder /build/apps/backend/package.json . 

# packages/commons は node_modules が必要なので、最後にコピー
COPY --from=builder /build/packages/commons node_modules/@tech-post-cast/commons
COPY --from=builder /build/packages/database node_modules/@tech-post-cast/database

EXPOSE 3000 
CMD [ "yarn", "start:prod" ]
