import boto3
import os
import mimetypes
from PIL import Image

resize_bucket = "kyelse-cs346-resize"
s3_client = boto3.client("s3")


def resize_image(image_path, resized_path, size):
    with Image.open(image_path) as image:
        image.thumbnail((size, size))
        image.save(resized_path)
        print(f"Resized {image_path} to {size}px")


def lambda_handler(event, context):
    records = event.get("Records", [])

    for r in records:
        bucket = r["s3"]["bucket"]["name"]
        key = r["s3"]["object"]["key"]

        filename = os.path.basename(key)
        basename, extension = os.path.splitext(filename)
        download_path = f"/tmp/{filename}"
        print(f"Downloading {key} from {bucket} to {download_path}")
        s3_client.download_file(bucket, key, download_path)

        upload_path = f"/tmp/resized-{filename}"
        sizes = [1000, 200]
        for s in sizes:
            resize_image(download_path, upload_path, s)
            upload_key = f"{basename}-{s}{extension}"
            content_type, encoding = mimetypes.guess_type(upload_key)
            extra_args = {"ContentType": content_type, "ACL": "public-read"}
            s3_client.upload_file(
                upload_path, resize_bucket, upload_key, ExtraArgs=extra_args
            )
            print(f"Uploaded {upload_key} to {resize_bucket}")
