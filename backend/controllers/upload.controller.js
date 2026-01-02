export const handleUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { path, filename, originalname, mimetype, size } = req.file;

    return res.status(201).json({
      url: path,
      publicId: filename,
      originalname,
      mimetype,
      size,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
};

export default handleUpload;
