import sys
import boto3

args = sys.argv
BUCKET = args[1]

s3 = boto3.resource('s3')
bucket = s3.Bucket(BUCKET)
bucket.object_versions.delete()