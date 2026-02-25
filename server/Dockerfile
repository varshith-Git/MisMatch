# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM rust:1.82-slim AS builder

WORKDIR /app

# Cache dependency compilation separately from source
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

# Now copy real source and rebuild (only this step re-runs on code changes)
COPY src ./src
RUN touch src/main.rs && cargo build --release

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

# Install CA certs (needed for outbound HTTPS if ever used)
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/mismatch-server ./mismatch-server

# Railway injects $PORT — we bind to it. Fly.io uses 8080 by default.
ENV PORT=8080
EXPOSE 8080

CMD ["./mismatch-server"]
