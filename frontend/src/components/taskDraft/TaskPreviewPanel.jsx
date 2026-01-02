import { Flex, Card, Empty } from 'antd';
import { useAppSelector } from '../../app/hooks';
import { selectTaskDraft, selectTaskDraftState } from '../../features/taskDraft/selectors';
import FieldPreview from './FieldPreview';

const TaskPreviewPanel = () => {
  const task = useAppSelector(selectTaskDraft);
  const { activeScreenId } = useAppSelector(selectTaskDraftState);
  const activeScreen = task.screens.find((s) => s.id === activeScreenId);

  if (!activeScreen) {
    return <Empty description="No screen selected" />;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#075E54',
        color: '#fff',
        padding: '12px 16px',
        borderBottom: '1px solid #e5ddd5'
      }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Preview - {activeScreen.title}</h4>
      </div>

      {/* Preview Content */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        backgroundColor: '#fff'
      }}>
        {activeScreen.fields.length === 0 ? (
          <Empty description="Add fields to preview" style={{ marginTop: '40px' }} />
        ) : (
          <Flex vertical gap={16}>
            {activeScreen.fields.map((field) => (
              <FieldPreview key={field.id} field={field} />
            ))}
          </Flex>
        )}
      </div>
    </div>
  );
};

export default TaskPreviewPanel;