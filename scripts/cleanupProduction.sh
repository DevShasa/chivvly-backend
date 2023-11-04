#!/bin/bash

# Get the list of running container IDs from image 'divvly-api-production'
container_ids=$(sudo docker ps -a -q -f ancestor=divvly-api-production)

# Check if there are any containers from 'divvly-api-production'
if [ -n "$container_ids" ]; then
    echo "Stopping and removing containers from image 'divvly-api-production'..."
    sudo docker stop $container_ids
    sudo docker rm $container_ids
else
    echo "No containers from image 'divvly-api-production' found."
fi

# Get the image ID of 'divvly-api-production'
image_id=$(sudo docker images -q divvly-api-production)

# Check if the image 'divvly-api-production' exists
if [ -n "$image_id" ]; then
    echo "Removing image 'divvly-api-production'..."
    sudo docker rmi $image_id
else
    echo "Image 'divvly-api-production' not found."
fi
