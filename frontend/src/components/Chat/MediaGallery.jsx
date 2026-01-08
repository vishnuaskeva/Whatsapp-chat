import { Modal, Empty, Image, Spin } from "antd";

const MediaGallery = ({ visible, onClose, messages }) => {
  // Filter messages with attachments that are images
  const imageMessages = messages.filter(
    (msg) =>
      msg.attachments &&
      msg.attachments.length > 0 &&
      msg.attachments.some((att) => att.resourceType === "image")
  );

  const allImages = imageMessages.flatMap((msg) =>
    msg.attachments
      .filter((att) => att.resourceType === "image")
      .map((att) => ({
        url: att.secureUrl || att.url,
        fileName: att.filename,
        sender: msg.sender,
        createdAt: msg.createdAt,
      }))
  );

  return (
    <Modal
      title="Media Gallery"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
    >
      {allImages.length === 0 ? (
        <Empty
          description="No images in this conversation"
          style={{ marginTop: "40px" }}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {allImages.map((img, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
                backgroundColor: "#f5f5f5",
              }}
            >
              <Image
                src={img.url}
                alt={img.fileName || "Image"}
                preview={{
                  mask: "View",
                }}
                style={{ width: "100%", height: "200px", objectFit: "cover" }}
              />
              <div
                style={{
                  padding: "8px",
                  fontSize: "12px",
                  color: "#888",
                  borderTop: "1px solid #e0e0e0",
                  backgroundColor: "#fafafa",
                }}
              >
                <div>{img.sender}</div>
                <div>{new Date(img.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default MediaGallery;
