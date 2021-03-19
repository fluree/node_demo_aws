# CDK Fluree Deploy Demo
## from [webcast](https://us02web.zoom.us/rec/share/KXTuIMC1KEPNPKsB7jqQh8z_A-LUN3WQM91uMqKr3nI-ccdBa9nSuEraHi3351Jk.5xg0DYJK9NKttMUG?startTime=1616086836000)

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

## To replicate demo 
 * NOTE: make sure you have run `aws configure` and are setup in the correct aws account you want to deploy to
 * NOTE: leaving this running for any amount of time will create charges on your AWS bill 
 * `cdk deploy NodeDemoAwsStack` deploy the ledger and node cluster
 * create a ledger: `curl --location --request POST 'http://[load balancer url]/api/db/[ledger name]/new_ledger' --header 'Content-Type: application/json'` 
 * i.e. `curl --location --request POST 'NodeD-NodeF-MFIO5M9JPL04-1306336054.us-east-1.elb.amazonaws.com/api/db/jake/test/new_ledger' --header 'Content-Type: application/json'`
 * `cdk deploy S3ToLambdaSeedStack`
 * note the bucket you created
 * upload eateries_schema.json to the s3 bucket
 * upload eateries.json to the s3 bucket
 * `curl --location --request POST http://[load balancer url]/api/db/[ledger name]/query --header 'Content-Type: application/json' --data-raw '{"query": {"select":["*"], "from": "eateries"}}'` to test you have uploaded data
 * i.e. `curl --location --request POST http://NodeD-NodeF-MFIO5M9JPL04-1306336054.us-east-1.elb.amazonaws.com/api/db/jake/test/query --header 'Content-Type: application/json' --data-raw '{"query": {"select":["*"], "from": "eateries"}}'`

 ## To generate load
 * modify lib/traffic_generator-stack.ts for the number of load generating tasks you want to run
 * `cdk deploy TrafficGeneratorStack`
 * watch the autoscaling work

 ## NOTE: Make sure to destroy all when complete
 * `cdk destroy --all` and answer any prompts to destroy the stacks