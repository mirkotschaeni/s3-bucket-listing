S3 Directory listing based on https://github.com/rgrp/s3-bucket-listing with a simple bootstrap ui.

Usage:

* add index.html and list.js to the root of your s3 bucket
* add an listOptions.json to the root of your s3 bucket containing: {"bucketName": "<bucketDisplayName>", "bucketUrl": "<urlOftheBucket>"}
* enable static web hosting
* set petrmissions to allow anonymous access to objects and listings