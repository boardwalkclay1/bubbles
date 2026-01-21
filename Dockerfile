FROM alpine:3.18

# Install dependencies PocketBase needs
RUN apk add --no-cache ca-certificates tzdata

# Create working directory
WORKDIR /app

# Copy the Linux PocketBase binary into the container
COPY pocketbase /app/pocketbase

# Copy migrations and hooks if you have them
COPY pb_migrations /app/pb_migrations
COPY pb_hooks /app/pb_hooks

# Expose PocketBase port
EXPOSE 8090

# Run PocketBase in production mode
CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090"]
