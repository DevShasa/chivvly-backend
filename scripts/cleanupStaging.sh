#!/bin/bash

# Get the list of running container IDs from image 'divvly-api-staging'
container_ids=$(sudo docker ps -a -q -f ancestor=divvly-api-staging)

# Check if there are any containers from 'divvly-api-staging'
if [ -n "$container_ids" ]; then
    echo "Stopping and removing containers from image 'divvly-api-staging'..."
    sudo docker stop $container_ids
    sudo docker rm $container_ids
else
    echo "No containers from image 'divvly-api-staging' found."
fi

# Get the image ID of 'divvly-api-staging'
image_id=$(sudo docker images -q divvly-api-staging)

# Check if the image 'divvly-api-staging' exists
if [ -n "$image_id" ]; then
    echo "Removing image 'divvly-api-staging'..."
    sudo docker rmi $image_id
else
    echo "Image 'divvly-api-staging' not found."
fi
