#!/bin/bash


git archive --format=tar.gz -o deploy.tgz $BITBUCKET_COMMIT

HEROKU_VERSION=$BITBUCKET_COMMIT
APP_NAME="trackapio" # Your app's name in heroku goes here

echo "Deploying Heroku Version 3"

URL_BLOB=`curl -s -n -X POST https://api.heroku.com/apps/trackapio/sources \
-H 'Accept: application/vnd.heroku+json; version=3' \
-H "Authorization: Bearer 857b20a5-0fa8-491f-9458-9dc50369d57d"`

PUT_URL=`echo $URL_BLOB | python -c 'import sys, json; print(json.load(sys.stdin)["source_blob"]["put_url"])'`
GET_URL=`echo $URL_BLOB | python -c 'import sys, json; print(json.load(sys.stdin)["source_blob"]["get_url"])'`

curl $PUT_URL  -X PUT -H 'Content-Type:' --data-binary @deploy.tgz

REQ_DATA="{\"source_blob\": {\"url\":\"$GET_URL\", \"version\": \"2\"}}"

BUILD_OUTPUT=`curl -s -n -X POST https://api.heroku.com/apps/trackapio/builds \
-d "$REQ_DATA" \
-H 'Accept: application/vnd.heroku+json; version=3' \
-H "Content-Type: application/json" \
-H "Authorization: Bearer 857b20a5-0fa8-491f-9458-9dc50369d57d"`

STREAM_URL=`echo $BUILD_OUTPUT | python -c 'import sys, json; print(json.load(sys.stdin)["output_stream_url"])'`

curl $STREAM_URL