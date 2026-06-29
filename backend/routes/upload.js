const express = require("express");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const router = express.Router();

// Ensure you have these in your backend/.env
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post("/presigned-url", async (req, res) => {
  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: "fileName and fileType are required" });
  }

  // Sanitize file name to avoid URL encoding issues that break S3 signatures
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "");
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${sanitizedName}`;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!bucketName) {
    return res.status(500).json({ error: "AWS_S3_BUCKET_NAME is not configured in .env" });
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFileName,
      ContentType: fileType,
    });

    // The presigned URL expires in 60 seconds
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // This is the public URL where the image will be accessible after successful upload
    const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${uniqueFileName}`;

    res.json({ signedUrl, publicUrl });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

module.exports = router;
