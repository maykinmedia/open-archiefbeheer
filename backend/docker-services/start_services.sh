#!/bin/bash

set -e

check_docker() {
  OS="$(uname -s)"

  case "$OS" in

      Linux*)
          log_info "OS detected: Linux ($OS)"
          check_docker_linux
          ;;

      Darwin*)
          log_info "OS detected: macOS ($OS)"
          check_docker_mac
          ;;

      *)
          log_error "Unsupported OS: $OS"
          exit 1
          ;;
  esac
}

check_docker_linux() {
    if ! curl -s -X GET http://127.0.0.1:2375/_ping | grep -q "OK"; then
        log_info "Docker not running. Restarting..."
        sudo systemctl stop docker.service
        sudo dockerd \
          -H unix:///var/run/docker.sock \
          -H tcp://127.0.0.1:2375 &

        log_info "dockerd restarted. PID: $!"
        sleep 5
    else
        log_info "Docker daemon is accessible on 127.0.0.1:2375."
    fi
}

check_docker_mac() {
    if ! docker info >/dev/null 2>&1; then
        log_info "Docker not running. Restarting..."
        open -a Docker

        until docker info >/dev/null 2>&1; do
            log_info "Waiting for Docker to start..."
            sleep 1
        done
    fi

    log_info "Docker Desktop is running."
}

log_info() {
    printf '[INFO] %s\n' "$1"
}

log_error() {
    printf '[ERROR] %s\n' "$1" >&2
}

check_docker
docker compose -f openzaak/docker-compose.yaml up -d
docker compose -f openklant/docker-compose.yaml up -d
docker compose -f objecten/docker-compose.yaml up -d

