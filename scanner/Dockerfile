FROM rust:1.94-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY core core
COPY scanner scanner
COPY cli cli

RUN cargo build --release -p turnstile-scanner

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --create-home --uid 10001 turnstile

COPY --from=builder /build/target/release/turnstile-scanner /usr/local/bin/turnstile-scanner

USER turnstile
ENV PORT=8080
EXPOSE 8080

CMD ["turnstile-scanner"]
