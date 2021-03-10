const fetch = require('node-fetch');
const AWS = require('aws-sdk');

async function sendPost(jsonContent: any) {
    console.log("from post function: ", jsonContent);
    const url = `${process.env.HOST}/api/db${process.env.LEDGER}/transact`
    const params = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonContent
    }
    return await fetch(url, params);
}
const s3 = new AWS.S3();

exports.handler = async (event: any) => {
    //log the event
    console.log(event.Records[0].s3);
    const payload = event.Records[0].s3;
    const srcBucket = payload.bucket.name;
    console.log("bucket: ", srcBucket);
    const srcKey = payload.object.key;
    console.log("key: ", srcKey);
    try {
        const params = {
            Bucket: srcBucket,
            Key: srcKey
        }
        var jsonContent = await s3.getObject(params).promise();
    } catch (error) {
        console.log(error);
    }


    const results = await sendPost(jsonContent.Body.toString('ascii'));

    const response = {
        statusCode: 200,
        body: results
    };

    return response;
};
