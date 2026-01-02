import { Flex, Input, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateScreenTitle } from '../../features/taskDraft/taskDraftSlice';
import { selectTaskDraft } from '../../features/taskDraft/selectors';
import AddFieldMenu from './AddFieldMenu';
import FieldEditor from './FieldEditor';

const ScreenEditor = ({ activeScreenId }) => {
  const dispatch = useAppDispatch();
  const task = useAppSelector(selectTaskDraft);
  const activeScreen = task.screens.find((s) => s.id === activeScreenId);

  if (!activeScreen) {
    return <div>Select a screen to edit</div>;
  }

  const handleScreenTitleChange = (value) => {
    dispatch(updateScreenTitle({ screenId: activeScreenId, title: value }));
  };

  return (
    <Flex vertical gap={12} style={{ maxHeight: 500, overflowY: 'auto', paddingRight: 8 }}>
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: 13, fontWeight: 500, color: '#075E54' }}>Screen title</label>
        <Input
          placeholder="Screen title"
          value={activeScreen.title}
          onChange={(e) => handleScreenTitleChange(e.target.value)}
          style={{ borderColor: '#e5ddd5' }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#25D366';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e5ddd5';
          }}
        />
      </div>

      <AddFieldMenu screenId={activeScreenId} />

      {activeScreen.fields.length > 0 && (
        <div>
          {activeScreen.fields.map((field) => (
            <FieldEditor key={field.id} field={field} screenId={activeScreenId} />
          ))}
        </div>
      )}
    </Flex>
  );
};

export default ScreenEditor;