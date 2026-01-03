import {
  Card,
  Typography,
  Divider,
  Tag,
  Input,
  Select,
  Button,
  Image,
} from "antd";
import {
  CloudUploadOutlined,
  FileOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

const ChatTaskPreview = ({ task }) => {
  if (!task) return null;

  const renderFieldPreview = (field) => {
    const sampleValue = field.config?.sampleValue || "";

    switch (field.type) {
      case "text":
        return (
          <div style={{ marginBottom: 12 }}>
            <Input
              type={field.config?.inputType || "text"}
              placeholder={field.label}
              value={sampleValue}
              readOnly
              style={{
                borderRadius: "4px",
                border: "1px solid #d9d9d9",
                padding: "8px",
              }}
              size="large"
            />
          </div>
        );
      case "textarea":
        return (
          <div style={{ marginBottom: 12 }}>
            <Input.TextArea
              placeholder={field.label}
              value={sampleValue}
              readOnly
              rows={3}
              style={{
                borderRadius: "4px",
                border: "1px solid #d9d9d9",
                padding: "8px",
              }}
            />
          </div>
        );
      case "number":
        return (
          <div style={{ marginBottom: 12 }}>
            <Input
              type="number"
              placeholder={field.label}
              value={sampleValue}
              readOnly
              style={{
                borderRadius: "4px",
                border: "1px solid #d9d9d9",
                padding: "8px",
              }}
              size="large"
            />
          </div>
        );
      case "select":
        return (
          <div style={{ marginBottom: 12 }}>
            <Select
              placeholder={field.label}
              value={sampleValue || undefined}
              disabled
              mode={field.config?.multiple ? "multiple" : undefined}
              style={{ width: "100%" }}
              options={
                field.config?.options?.map((opt) => ({
                  value: opt,
                  label: opt,
                })) || []
              }
            />
          </div>
        );
      case "media-image":
      case "media-file": {
        const uploadedFile = field.config?.uploadedFile;
        if (uploadedFile) {
          const isImage =
            field.type === "media-image" ||
            uploadedFile.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          return (
            <div style={{ marginBottom: 12 }}>
              {isImage ? (
                <div
                  style={{
                    maxHeight: "200px",
                    borderRadius: "4px",
                    overflow: "hidden",
                    border: "1px solid #d9d9d9",
                  }}
                >
                  <Image
                    src={uploadedFile.url}
                    preview
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
              ) : (
                <a href={uploadedFile.url} target="_blank" rel="noreferrer">
                  <Button
                    icon={<FileOutlined />}
                    block
                    style={{
                      borderRadius: "4px",
                      border: "1px solid #1890ff",
                      backgroundColor: "#e6f7ff",
                      color: "#1890ff",
                      height: "40px",
                    }}
                  >
                    {uploadedFile.name}
                  </Button>
                </a>
              )}
            </div>
          );
        }
        return (
          <div style={{ marginBottom: 12 }}>
            <Button
              icon={<CloudUploadOutlined />}
              block
              disabled
              style={{
                borderRadius: "4px",
                border: "1px dashed #d9d9d9",
                height: "40px",
                color: "#999",
                backgroundColor: "#fafafa",
              }}
            >
              {`Upload ${field.label}`}
            </Button>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Card
      size="large"
      style={{
        maxWidth: 520,
        backgroundColor: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Task Title */}
      <Title
        level={4}
        style={{
          marginBottom: 16,
          marginTop: 0,
          color: "#262626",
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        {task.title || "Task"}
      </Title>

      {/* Screens */}
      {task.screens.map((screen, screenIdx) => (
        <div key={screen.id}>
          {/* Screen Title */}
          {task.screens.length > 1 && (
            <Divider
              orientation="left"
              style={{
                margin: "16px 0 12px 0",
                borderColor: "#e8e8e8",
                fontSize: 13,
                fontWeight: 600,
                color: "#626262",
              }}
            >
              {screen.title || `Screen ${screenIdx + 1}`}
            </Divider>
          )}

          {/* Fields */}
          <div
            style={{
              marginBottom: screenIdx === task.screens.length - 1 ? 0 : 16,
            }}
          >
            {screen.fields.map((field) => (
              <div key={field.id} style={{ marginBottom: 14 }}>
                {/* Field Label */}
                <div
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text
                    strong
                    style={{
                      fontSize: 13,
                      color: "#262626",
                      fontWeight: 600,
                    }}
                  >
                    {field.label}
                  </Text>
                  {field.required && (
                    <Tag color="red" style={{ fontSize: 11 }}>
                      Required
                    </Tag>
                  )}
                </div>

                {/* Field Preview */}
                {renderFieldPreview(field)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Card>
  );
};

export default ChatTaskPreview;
