import { Input, Select, Button, Flex, Image, Tag } from 'antd';
import { UploadOutlined, FileOutlined } from '@ant-design/icons';

const FieldPreview = ({ field }) => {
  const labelStyle = { 
    display: 'block', 
    marginBottom: '8px', 
    fontSize: '14px', 
    fontWeight: '600', 
    color: '#075E54'
  };
  const requiredBadge = field.required && (
    <Tag color="red" style={{ marginLeft: '6px', fontSize: '11px' }}>Required</Tag>
  );

  const containerStyle = { 
    marginBottom: '16px',
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: '#fafafa',
    border: '1px solid #e5ddd5'
  };

  switch (field.type) {
    case 'text':
      return (
        <div style={containerStyle}>
          <Flex align="center" gap={8} style={{ marginBottom: '8px' }}>
            <span style={labelStyle}>{field.label || 'Text field'}</span>
            {requiredBadge}
          </Flex>
          <Input 
            type={field.config.inputType || 'text'} 
            placeholder="Sample value" 
            value={field.config.sampleValue || 'Enter text...'}
            disabled 
            size="large" 
            style={{ borderRadius: '6px', border: '1px solid #d9d9d9' }}
          />
        </div>
      );
    case 'number':
      return (
        <div style={containerStyle}>
          <Flex align="center" gap={8} style={{ marginBottom: '8px' }}>
            <span style={labelStyle}>{field.label || 'Number field'}</span>
            {requiredBadge}
          </Flex>
          <Input 
            type="number" 
            placeholder="0" 
            value={field.config.sampleValue || '0'}
            disabled 
            size="large" 
            style={{ borderRadius: '6px', border: '1px solid #d9d9d9' }}
          />
        </div>
      );
    case 'textarea':
      return (
        <div style={containerStyle}>
          <Flex align="center" gap={8} style={{ marginBottom: '8px' }}>
            <span style={labelStyle}>{field.label || 'Text answer'}</span>
            {requiredBadge}
          </Flex>
          <Input.TextArea 
            placeholder="Enter your answer..." 
            rows={3} 
            value={field.config.sampleValue || 'Sample text answer...'}
            disabled 
            style={{ borderRadius: '6px', border: '1px solid #d9d9d9' }}
          />
        </div>
      );
    case 'select':
      const options = (field.config.options || []).length > 0 
        ? field.config.options.map((o) => ({ value: o, label: o }))
        : [{ value: '1', label: 'Option 1' }, { value: '2', label: 'Option 2' }];
      
      return (
        <div style={containerStyle}>
          <Flex align="center" gap={8} style={{ marginBottom: '12px' }}>
            <span style={labelStyle}>{field.label || 'Selection'}</span>
            {requiredBadge}
          </Flex>
          {field.config.multiple ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {options.map((opt) => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '4px', backgroundColor: '#fff' }}>
                  <input type="checkbox" disabled style={{ cursor: 'default' }} />
                  <span style={{ fontSize: '13px' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {options.map((opt) => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '4px', backgroundColor: '#fff' }}>
                  <input type="radio" name={field.id} disabled style={{ cursor: 'default' }} />
                  <span style={{ fontSize: '13px' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      );
    case 'media-image':
    case 'media-file':
      const uploadedFile = field.config?.uploadedFile;
      if (uploadedFile) {
        const isImage = field.type === 'media-image' || uploadedFile.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        return (
          <div style={containerStyle}>
            <Flex align="center" gap={8} style={{ marginBottom: '12px' }}>
              <span style={labelStyle}>{field.label || (isImage ? 'Image upload' : 'File upload')}</span>
              {requiredBadge}
            </Flex>
            {isImage ? (
              <div style={{ maxHeight: '160px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #d9d9d9', backgroundColor: '#fff' }}>
                <Image src={uploadedFile.url} preview style={{ width: '100%', height: 'auto' }} />
              </div>
            ) : (
              <a href={uploadedFile.url} target="_blank" rel="noreferrer">
                <Button
                  icon={<FileOutlined />}
                  block
                  style={{
                    borderRadius: '6px',
                    border: '1px solid #25D366',
                    backgroundColor: '#f0f9f6',
                    color: '#25D366',
                    height: '40px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  📎 {uploadedFile.name}
                </Button>
              </a>
            )}
          </div>
        );
      }
      return (
        <div style={containerStyle}>
          <Flex align="center" gap={8} style={{ marginBottom: '12px' }}>
            <span style={labelStyle}>{field.label || (field.type === 'media-image' ? 'Image upload' : 'File upload')}</span>
            {requiredBadge}
          </Flex>
          <Button 
            disabled 
            size="large" 
            icon={<UploadOutlined />} 
            block
            style={{
              borderRadius: '6px',
              border: '1px dashed #d9d9d9',
              backgroundColor: '#fafafa',
              height: '40px'
            }}
          >
            Click to upload
          </Button>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px', textAlign: 'center' }}>
            Max size: {field.config.maxSize || 5} MB
          </div>
        </div>
      );
    default:
      return (
        <div style={containerStyle}>
          <Flex align="center" gap={8}>
            <span style={labelStyle}>{field.label || 'New field'}</span>
            {requiredBadge}
          </Flex>
        </div>
      );
  }
};

export default FieldPreview;
