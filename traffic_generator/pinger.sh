#!/bin/sh

while true; do
  curl --location --request POST $URL \
    --header 'Content-Type: application/json' \
    --data-raw '{"query": {"select":["*"],"from":"_collection"}}' 
done
