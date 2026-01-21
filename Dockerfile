FROM alpine:3.18

RUN apk add --no-cache curl unzip ca-certificates tzdata

WORKDIR /app

# Download PocketBase Linux binary directly during build
RUN curl -L -o pb.zip https://github.com/pocketbase/pocketbase/releases/download/v0.36.1/pocketbase_0.36.1_linux_amd64.zip \
    && unzip pb.zip \
    && rm pb.zip \
    && chmod +x pocketbase

EXPOSE 8090

CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090"]
