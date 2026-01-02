import { Input, Select, Checkbox, Button, Flex, Divider, message, Spin } from 'antd';
import { DeleteOutlined, PlusOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { updateField, removeField } from '../../features/taskDraft/taskDraftSlice';
import { useUploadFileMutation } from '../../features/chat/chatApi';

const FieldEditor = ({ field, screenId }) => {
  const dispatch = useAppDispatch();
  const [uploadFile] = useUploadFileMutation();
  const [tempSampleValue, setTempSampleValue] = useState(field.config.sampleValue || '');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setTempSampleValue(field.config.sampleValue || '');
  }, [field.config.sampleValue]);

  const handleLabelChange = (value) => {
    dispatch(updateField({ screenId, fieldId: field.id, changes: { label: value } }));
  };

  const handleConfigChange = (key, value) => {
    dispatch(updateField({ screenId, fieldId: field.id, changes: { config: { ...field.config, [key]: value } } }));
  };

  const handleRequiredChange = (checked) => {
    dispatch(updateField({ screenId, fieldId: field.id, changes: { required: checked } }));
  };

  const handleDelete = () => {
    dispatch(removeField({ screenId, fieldId: field.id }));
  };

  const handleSampleValueChange = (value) => {
    handleConfigChange('sampleValue', value);
  };

  const handleConfirmSampleValue = () => {
    handleConfigChange('sampleValue', tempSampleValue);
  };

  const addOption = () => {
    const newOptions = [...(field.config.options || []), 'New option'];
    handleConfigChange('options', newOptions);
  };

  const updateOption = (index, value) => {
    const newOptions = [...(field.config.options || [])];
    newOptions[index] = value;
    handleConfigChange('options', newOptions);
  };

  const removeOption = (index) => {
    const newOptions = field.config.options.filter((_, i) => i !== index);
    handleConfigChange('options', newOptions);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = (field.config?.maxSize || 5) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      message.error(`File size exceeds ${field.config?.maxSize || 5} MB limit`);
      return;
    }

    // Validate file type
    const fileType = field.config?.fileType || 'any';
    const isValidType = validateFileType(file, fileType);
    if (!isValidType) {
      message.error(`Invalid file type. Expected ${fileType}`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadFile(formData).unwrap();
      const uploadInfo = {
        url: response.url,
        name: response.originalname,
        size: response.size,
        publicId: response.publicId,
      };

      handleConfigChange('uploadedFile', uploadInfo);
      message.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const validateFileType = (file, fileType) => {
    const mimeType = file.type;
    const fileName = file.name;
    const ext = fileName.split('.').pop().toLowerCase();

    if (fileType === 'image') {
      return mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    }
    return true; // Accept any file type for 'file' option
  };

  const getAcceptedFileTypes = (fileType) => {
    if (fileType === 'image') return 'image/*';
    return '*/*'; // Accept all file types
  };

  const handleRemoveFile = () => {
    handleConfigChange('uploadedFile', null);
  };

  const getFieldTypeLabel = (type) => {
    const typeMap = {
      'text': 'Text',
      'textarea': 'Text Answer',
      'number': 'Number',
      'select': 'Selection',
      'media-image': 'Image Upload',
      'media-file': 'File Upload',
    };
    return typeMap[type] || type;
  };

  return (
    <div style={{ padding: '14px', border: '1px solid #e8e8e8', borderRadius: '6px', marginBottom: '12px', backgroundColor: '#fafafa' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: '14px' }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#262626' }}>{getFieldTypeLabel(field.type)}</span>
        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={handleDelete} />
      </Flex>

      {/* Label - Field Name */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: 13, fontWeight: 600, color: '#075E54' }}>Label</label>
        <Input 
          placeholder="Enter field label (e.g., 'Full Name')" 
          value={field.label} 
          onChange={(e) => handleLabelChange(e.target.value)}
          style={{ 
            borderRadius: '4px', 
            border: '1px solid #d9d9d9', 
            padding: '8px', 
            minHeight: '32px',
            transition: 'all 0.3s ease'
          }}
          size="large"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#25D366';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 211, 102, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d9d9d9';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#25D366';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 211, 102, 0.2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#d9d9d9';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Required */}
      <div style={{ marginBottom: '14px' }}>
        <Checkbox checked={field.required} onChange={(e) => handleRequiredChange(e.target.checked)}>
          <span style={{ fontSize: 13 }}>Required</span>
        </Checkbox>
      </div>

      {/* Input Type for text fields */}
      {field.type === 'text' && (
        <>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: 13, fontWeight: 600, color: '#075E54' }}>Input type</label>
            <div
              style={{
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                transition: 'all 0.3s ease',
                backgroundColor: '#fff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#25D366';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 211, 102, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Select
                value={field.config.inputType || 'text'}
                onChange={(value) => handleConfigChange('inputType', value)}
                style={{ width: '100%' }}
                options={[
                  { value: 'text', label: 'Text' },
                  { value: 'password', label: 'Password' },
                  { value: 'email', label: 'Email' },
                  { value: 'tel', label: 'Phone' },
                ]}
                variant="borderless"
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: 13, fontWeight: 600, color: '#075E54' }}>Sample value</label>
            <Flex gap={8} align="center">
              <Input 
                type={field.config.inputType || 'text'}
                placeholder={`Enter sample ${field.config.inputType || 'text'}`}
                value={tempSampleValue}
                onChange={(e) => setTempSampleValue(e.target.value)}
                style={{ 
                  borderRadius: '4px', 
                  border: '1px solid #d9d9d9', 
                  padding: '8px',
                  transition: 'all 0.3s ease'
                }}
                size="large"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#25D366';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 211, 102, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#25D366';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 211, 102, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <Button 
                type="primary" 
                onClick={handleConfirmSampleValue}
                style={{ 
                  backgroundColor: '#25D366', 
                  borderColor: '#25D366',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#20BA5A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#25D366';
                }}
              >
                OK
              </Button>
            </Flex>
          </div>
        </>
      )}

      {/* Sample value for Number field */}
      {field.type === 'number' && (
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: 13, fontWeight: 600, color: '#075E54' }}>Sample value</label>
          <Flex gap={8} align="center">
            <Input 
              type="number"
              placeholder="Enter sample number"
              value={tempSampleValue}
              onChange={(e) => setTempSampleValue(e.target.value)}
              style={{ 
                borderRadius: '4px', 
                border: '1px solid #d9d9d9', 
                padding: '8px',
                transition: 'all 0.3s ease'
              }}
              size="large"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#25D366';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 211, 102, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#25D366';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 211, 102, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <Button 
              type="primary" 
              onClick={handleConfirmSampleValue}
              style={{ 
                backgroundColor: '#25D366', 
                borderColor: '#25D366',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#20BA5A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#25D366';
              }}
            >
              OK
            </Button>
          </Flex>
        </div>
      )}

      {/* Sample value for Text Answer field */}
      {field.type === 'textarea' && (
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: 13, fontWeight: 600, color: '#075E54' }}>Sample value</label>
          <Flex vertical gap={8}>
            <Input.TextArea
              placeholder="Enter sample text"
              value={tempSampleValue}
              onChange={(e) => setTempSampleValue(e.target.value)}
              rows={3}
              style={{ 
                borderRadius: '4px', 
                border: '1px solid #d9d9d9', 
                padding: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#25D366';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 211, 102, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#25D366';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 211, 102, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <Button 
              type="primary" 
              onClick={handleConfirmSampleValue} 
              style={{ 
                alignSelf: 'flex-end',
                backgroundColor: '#25D366', 
                borderColor: '#25D366',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#20BA5A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#25D366';
              }}
            >
              OK
            </Button>
          </Flex>
        </div>
      )}

      {/* Allow Multiple for Selection */}
      {field.type === 'select' && (
        <>
          <div style={{ marginBottom: '14px' }}>
            <Checkbox 
              checked={field.config.multiple || false} 
              onChange={(e) => handleConfigChange('multiple', e.target.checked)}
            >
              <span style={{ fontSize: 13 }}>Allow multiple selections</span>
            </Checkbox>
          </div>

          {/* Options */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: 13, fontWeight: 600, color: '#075E54' }}>Options</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(field.config.options || []).map((option, index) => (
                <Flex key={index} gap={8} align="center">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    style={{ 
                      borderRadius: '4px', 
                      border: '1px solid #d9d9d9', 
                      padding: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    size="large"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#25D366';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 211, 102, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d9d9d9';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <Button type="default" danger onClick={() => removeOption(index)}>
                    Remove
                  </Button>
                </Flex>
              ))}
            </div>
            <Button 
              type="dashed" 
              block 
              icon={<PlusOutlined />} 
              onClick={addOption}
              style={{ marginTop: '8px', borderColor: '#25D366', color: '#25D366' }}
            >
              Add option
            </Button>
          </div>

          {/* Sample value for Selection */}
          {(field.config.options || []).length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: 13, fontWeight: 600, color: '#075E54' }}>Sample value</label>
              <Flex gap={8} align="center">
                <Select
                  placeholder="Select a sample option"
                  value={tempSampleValue || undefined}
                  onChange={(value) => setTempSampleValue(value)}
                  mode={field.config.multiple ? 'multiple' : undefined}
                  style={{ width: '100%' }}
                  options={field.config.options.map((opt) => ({ value: opt, label: opt }))}
                />
                <Button 
                  type="primary" 
                  onClick={handleConfirmSampleValue}
                  style={{ 
                    backgroundColor: '#25D366', 
                    borderColor: '#25D366',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#20BA5A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#25D366';
                  }}
                >
                  OK
                </Button>
              </Flex>
            </div>
          )}
        </>
      )}

      {/* File Type for Media */}
      {['media-image', 'media-file'].includes(field.type) && (
        <>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: 13, fontWeight: 600, color: '#262626' }}>File type</label>
            <Select
              value={field.config.fileType || (field.type === 'media-image' ? 'image' : 'file')}
              onChange={(value) => handleConfigChange('fileType', value)}
              style={{ width: '100%' }}
              options={[
                { value: 'image', label: 'Image' },
                { value: 'file', label: 'File' },
              ]}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: 13, fontWeight: 600, color: '#262626' }}>Max size (MB)</label>
            <Input
              type="number"
              value={field.config.maxSize || 5}
              onChange={(e) => handleConfigChange('maxSize', parseInt(e.target.value) || 5)}
              placeholder="5"
              min="1"
              style={{ borderRadius: '4px', border: '1px solid #d9d9d9', padding: '8px' }}
              size="large"
            />
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: 13, fontWeight: 600, color: '#262626' }}>Upload file</label>
            {uploading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: '#fafafa', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
                <Spin />
              </div>
            ) : field.config?.uploadedFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: '4px', border: '1px solid #b3d9ff' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0050b3' }}>{field.config.uploadedFile.name}</div>
                  <div style={{ fontSize: 11, color: '#595959', marginTop: 2 }}>
                    {(field.config.uploadedFile.size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleRemoveFile}
                  size="small"
                />
              </div>
            ) : (
              <>
                <input
                  id={`file-upload-${field.id}`}
                  type="file"
                  accept={getAcceptedFileTypes(field.config?.fileType)}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  icon={<CloudUploadOutlined />}
                  block
                  style={{ borderRadius: '4px', border: '1px dashed #d9d9d9', height: '40px', cursor: 'pointer' }}
                  onClick={() => {
                    document.getElementById(`file-upload-${field.id}`).click();
                  }}
                >
                  Click to upload
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FieldEditor;