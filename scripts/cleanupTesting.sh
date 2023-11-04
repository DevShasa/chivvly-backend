#!/bin/bash

# Get the list of running container IDs from image 'divvly-api'
container_ids=$(sudo docker ps -a -q -f ancestor=divvly-api-testing)

# Check if there are any containers from 'divvly-api'
if [ -n "$container_ids" ]; then
    echo "Stopping and removing containers from image 'divvly-api-testing'..."
    sudo docker stop $container_ids
    sudo docker rm $container_ids
else
    echo "No containers from image 'divvly-api-testing' found."
fi

# Get the image ID of 'divvly-api-testing'
image_id=$(sudo docker images -q divvly-api-testing)

# Check if the image 'divvly-api-testing' exists
if [ -n "$image_id" ]; then
    echo "Removing image 'divvly-api-testing'..."
    sudo docker rmi $image_id
else
    echo "Image 'divvly-api-testing' not found."
fi
