#!/bin/bash

set -e


if ! curl -s -X GET http://127.0.0.1:2375/_ping | grep -q "OK"; then
    echo "Docker daemon not accessible on 127.0.0.1:2375. Restarting..."
    # TODO: this was only tested on linux. Will not work on Mac. See issue #934
    
    # Stop the docker service
    systemctl stop docker.service
    
    # Start dockerd in background with Unix socket and TCP
    dockerd -H unix:///var/run/docker.sock -H tcp://127.0.0.1:2375 &
    echo "dockerd restarted. PID: $!"
else
    echo "Docker daemon is accessible on 127.0.0.1:2375."
fi

docker compose -f openzaak/docker-compose.yaml up -d

docker compose -f openklant/docker-compose.yaml up -d

docker compose -f objecten/docker-compose.yaml up -d

