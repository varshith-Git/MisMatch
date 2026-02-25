# ── Stage 1: Build (static binary with musl) ──────────────────────────────────
FROM rust:latest AS builder

# Add musl target for a fully static binary (no system lib dependencies)
RUN rustup target add x86_64-unknown-linux-musl
RUN apt-get update && apt-get install -y --no-install-recommends musl-tools && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN cargo build --release --target x86_64-unknown-linux-musl

# ── Stage 2: Minimal runtime (no libc needed, binary is static) ───────────────
FROM scratch AS runtime

COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/mismatch-server /mismatch-server

# Render / Koyeb / Fly.io inject $PORT at runtime
ENV PORT=8080
EXPOSE 8080

CMD ["/mismatch-server"]
