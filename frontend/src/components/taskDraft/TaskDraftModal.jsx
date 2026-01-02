import { useMemo, useEffect } from 'react';
import { Modal, Button, Flex, Input, notification } from 'antd';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  closeTaskDraft,
  resetTaskDraft,
  updateTaskTitle,
  loadTaskDraft,
} from '../../features/taskDraft/taskDraftSlice';
import { selectTaskDraftState, selectTaskDraft } from '../../features/taskDraft/selectors';
import ScreenList from './ScreenList';
import ScreenEditor from './ScreenEditor';
import TaskPreviewPanel from './TaskPreviewPanel';
import { useGetTaskDraftQuery, useSaveTaskDraftMutation } from '../../features/taskDraft/taskDraftApi';

const TaskDraftModal = ({ onSubmit, currentUser }) => {
  const dispatch = useAppDispatch();
  const { isOpen, activeScreenId } = useAppSelector(selectTaskDraftState);
  const task = useAppSelector(selectTaskDraft);
  const { data: savedDraft } = useGetTaskDraftQuery(currentUser, { skip: !currentUser });
  const [saveTaskDraft] = useSaveTaskDraftMutation();

  const canSubmit = useMemo(() => {
    if (!task.title.trim()) return false;
    // Allow submission even if screens have no fields (user can add them later)
    return task.screens.every((s) => s.title.trim());
  }, [task]);

  const handleCancel = () => {
    dispatch(closeTaskDraft());
    dispatch(resetTaskDraft());
  };

  const handleConfirm = () => {
    if (!canSubmit) {
      notification.warning({ message: 'Please enter a task title before confirming.' });
      return;
    }
    if (currentUser) {
      saveTaskDraft({ owner: currentUser, task }).catch(() => {});
    }
    onSubmit(task);
    dispatch(closeTaskDraft());
    dispatch(resetTaskDraft());
  };

  // NO auto-loading of draft. Modal always opens fresh.
  // User can create new task or click a "Load Previous Draft" button if needed.

  return (
    <Modal
      open={isOpen}
      title="Create Task"
      onCancel={handleCancel}
      footer={null}
      width={1200}
      destroyOnHidden
      styles={{
        content: {
          backgroundColor: '#fff'
        }
      }}
      modalRender={(modal) => (
        <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
          {modal}
        </div>
      )}
    >
      <Flex vertical gap={12} style={{ minHeight: 520 }}>
        <Input
          placeholder="Task title"
          value={task.title}
          onChange={(e) => dispatch(updateTaskTitle(e.target.value))}
          size="large"
          style={{ 
            borderRadius: '6px',
            border: '1px solid #d9d9d9',
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
        <Flex gap={12} style={{ minHeight: 420 }}>
          <div style={{ width: 180, borderRight: '1px solid #e5ddd5', paddingRight: 12, overflowY: 'auto', maxHeight: 400 }}>
            <ScreenList />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ScreenEditor activeScreenId={activeScreenId} />
          </div>
          <div style={{ width: 280, borderLeft: '1px solid #e5ddd5', paddingLeft: 12, overflowY: 'auto', maxHeight: 400 }}>
            <h4 style={{ marginTop: 0, color: '#075E54', fontWeight: '600' }}>Preview</h4>
            <TaskPreviewPanel />
          </div>
        </Flex>
        <Flex justify="end" gap={8}>
          <Button 
            onClick={handleCancel}
            style={{ 
              borderColor: '#128C7E', 
              color: '#128C7E',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            onClick={handleConfirm} 
            disabled={!canSubmit}
            style={{ 
              backgroundColor: '#25D366', 
              borderColor: '#25D366',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#20BA5A';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#25D366';
              }
            }}
          >
            Confirm
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default TaskDraftModal;