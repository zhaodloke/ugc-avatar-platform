import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
from typing import Optional
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)


class LocalStorageService:
    """Local file storage for development (fallback when S3 is not configured)"""

    def __init__(self):
        # Create local storage directory
        self.storage_dir = Path(os.path.dirname(os.path.dirname(__file__))) / "local_storage"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Using local storage at {self.storage_dir}")

    def upload_file(self, file_data: bytes, key: str, content_type: str = "application/octet-stream") -> str:
        """Save file locally and return URL"""
        try:
            # Create subdirectories as needed
            file_path = self.storage_dir / key
            file_path.parent.mkdir(parents=True, exist_ok=True)

            # Write file
            with open(file_path, 'wb') as f:
                f.write(file_data)

            # Return a local file URL that can be served
            url = f"/local_storage/{key}"
            logger.info(f"Saved file to {file_path}")
            return url

        except Exception as e:
            logger.error(f"Failed to save file: {e}")
            raise

    def download_file(self, key: str) -> bytes:
        """Read file from local storage"""
        try:
            file_path = self.storage_dir / key
            with open(file_path, 'rb') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to read file: {e}")
            raise

    def generate_presigned_url(self, key: str, expiration: int = 3600) -> str:
        """For local storage, just return the local URL"""
        return f"{settings.PUBLIC_BASE_URL.rstrip('/')}/local_storage/{key}"

    def delete_file(self, key: str) -> bool:
        """Delete file from local storage"""
        try:
            file_path = self.storage_dir / key
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted file: {key}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete file: {e}")
            return False


class S3StorageService:
    """S3/MinIO storage service"""

    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.bucket = settings.S3_BUCKET
        # Use public endpoint for browser-accessible URLs, fallback to internal endpoint
        self.public_endpoint = settings.S3_PUBLIC_ENDPOINT or settings.S3_ENDPOINT

    def upload_file(self, file_data: bytes, key: str, content_type: str = "application/octet-stream") -> str:
        """Upload file to S3 and return browser-accessible URL"""
        try:
            self.s3_client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=file_data,
                ContentType=content_type
            )

            # Generate browser-accessible URL using public endpoint
            if self.public_endpoint:
                url = f"{self.public_endpoint}/{self.bucket}/{key}"
            else:
                url = f"https://{self.bucket}.s3.amazonaws.com/{key}"

            logger.info(f"Uploaded file to {url}")
            return url

        except ClientError as e:
            logger.error(f"Failed to upload file: {e}")
            raise

    def download_file(self, key: str) -> bytes:
        """Download file from S3"""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket, Key=key)
            return response['Body'].read()
        except ClientError as e:
            logger.error(f"Failed to download file: {e}")
            raise

    def generate_presigned_url(self, key: str, expiration: int = 3600) -> str:
        """Generate presigned URL for file access (browser-accessible)"""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expiration
            )
            # Replace internal endpoint with public endpoint for browser access
            if settings.S3_ENDPOINT and self.public_endpoint and settings.S3_ENDPOINT != self.public_endpoint:
                url = url.replace(settings.S3_ENDPOINT, self.public_endpoint)
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise

    def delete_file(self, key: str) -> bool:
        """Delete file from S3"""
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=key)
            logger.info(f"Deleted file: {key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete file: {e}")
            return False


def get_storage_service():
    """Get appropriate storage service based on configuration"""
    has_credentials = bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY)
    logger.debug(f"[STORAGE] S3 credentials configured: {has_credentials}")
    if has_credentials:
        print("[STORAGE] Using S3 storage service")
        logger.info("Using S3 storage service")
        return S3StorageService()
    else:
        print("[STORAGE] S3 not configured, using local file storage")
        logger.info("S3 not configured, using local file storage")
        return LocalStorageService()


# Initialize storage service
print("[STORAGE] Initializing storage service...")
storage_service = get_storage_service()
print(f"[STORAGE] Storage service type: {type(storage_service).__name__}")
