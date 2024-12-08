FROM node:20.18.1-bullseye-slim as builder

WORKDIR /build

# yarn workspace 内のソースコードなどをコンテナー内にコピー
COPY . .
# 依存ライブラリをインストール
RUN yarn install --pure-lockfile --non-interactive
# prisma のスキーマを生成
RUN yarn prisma-generate
# ソースコードをビルド
RUN yarn build-all

# -----------------------------
FROM node:20.18.1-bullseye-slim

# AWS Lambda Adapter のインストール
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT 3000
ENV READINESS_CHECK_PATH /health-check

WORKDIR /app

# 依存ライブラリをインストール
COPY --from=builder /build/node_modules node_modules
# apps/backend のビルド結果をコンテナー内にコピー
COPY --from=builder /build/apps/backend/dist dist
# apps/backend の package.json をコンテナー内にコピー
COPY --from=builder /build/apps/backend/package.json . 

# yarn workspace 内の共通ライブラリ群（commons database）のビルド結果をコンテナー内にコピー
COPY --from=builder /build/packages/commons node_modules/@tech-post-cast/commons
COPY --from=builder /build/packages/database node_modules/@tech-post-cast/database

EXPOSE 3000 
CMD [ "yarn", "start:prod" ]
