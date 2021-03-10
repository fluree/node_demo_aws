#!/bin/sh

while true; do
  seq 1 3 | xargs -I{} -n 1 -P 3 curl --location --request POST $URL \
    --header 'Content-Type: application/json' \
    --data-raw '{"query": {"select":["*"],"from":"_collection"}}' 
done
