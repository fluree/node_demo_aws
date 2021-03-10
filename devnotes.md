
replace node-app.dev.flur.ee with your hostname for the node-app

curl to create a new ledger called jake/test
`curl --location --request POST 'http://node-app.dev.flur.ee/api/db/jake/test/new_ledger' --header 'Content-Type: application/json'`

curl to check for eateries
`curl --location --request POST http://node-app.dev.flur.ee/api/db/jake/test/query --header 'Content-Type: application/json' --data-raw '{"query": {"select":["*"], "from": "eateries"}}'`
get invalid connection

upload schema
curl to check for eateries
`curl --location --request POST http://node-app.dev.flur.ee/api/db/jake/test/query --header 'Content-Type: application/json' --data-raw '{"query": {"select":["*"], "from": "eateries"}}'`
get an empty array

upload some eateries -- eateries.json
`curl --location --request POST http://node-app.dev.flur.ee/api/db/jake/test/query --header 'Content-Type: application/json' --data-raw '{"query": {"select":["*"], "from": "eateries"}}'` | jq
see the eateries

