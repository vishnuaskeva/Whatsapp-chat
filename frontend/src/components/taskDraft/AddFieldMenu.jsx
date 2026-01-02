import { Button, Dropdown } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../app/hooks';
import { addField } from '../../features/taskDraft/taskDraftSlice';

const FIELD_CATEGORIES = [
  {
    label: 'Text',
    children: [
      { key: 'text', label: 'Text' },
      { key: 'text-password', label: 'Password' },
      { key: 'text-email', label: 'Email' },
      { key: 'text-phone', label: 'Phone' },
    ]
  },
  {
    label: 'Text Answer',
    children: [
      { key: 'textarea', label: 'Long Answer' }
    ]
  },
  {
    label: 'Selection',
    children: [
      { key: 'select', label: 'Dropdown' }
    ]
  },
  {
    label: 'Media Upload',
    children: [
      { key: 'media-image', label: 'Image' },
      { key: 'media-file', label: 'File' }
    ]
  }
];

const AddFieldMenu = ({ screenId }) => {
  const dispatch = useAppDispatch();

  const handleAddField = (type) => {
    dispatch(addField({ screenId, type }));
  };

  const items = FIELD_CATEGORIES.map((category) => ({
    label: category.label,
    children: category.children.map((field) => ({
      key: field.key,
      label: field.label,
      onClick: () => handleAddField(field.key),
    }))
  }));

  return (
    <Dropdown menu={{ items }} placement="bottom">
      <Button 
        icon={<PlusOutlined />} 
        block
        style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#fff', fontWeight: '500' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#20BA5A';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#25D366';
        }}
      >
        Add Field
      </Button>
    </Dropdown>
  );
};

export default AddFieldMenu;
