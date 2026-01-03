import { Button, Flex } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  addScreen,
  setActiveScreen,
  deleteScreen,
} from "../../features/taskDraft/taskDraftSlice";
import {
  selectTaskDraft,
  selectTaskDraftState,
} from "../../features/taskDraft/selectors";

const ScreenList = () => {
  const dispatch = useAppDispatch();
  const task = useAppSelector(selectTaskDraft);
  const { activeScreenId } = useAppSelector(selectTaskDraftState);

  const handleAddScreen = () => {
    dispatch(addScreen());
  };

  return (
    <Flex vertical gap={8}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        block
        onClick={handleAddScreen}
        style={{ backgroundColor: "#25D366", borderColor: "#25D366" }}
      >
        Add Screen
      </Button>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {task.screens.map((screen) => (
          <div
            key={screen.id}
            style={{ display: "flex", gap: "8px", alignItems: "center" }}
          >
            <Button
              style={{
                flex: 1,
                textAlign: "left",
                ...(activeScreenId === screen.id && {
                  backgroundColor: "#25D366",
                  borderColor: "#25D366",
                  color: "#fff",
                }),
              }}
              type={activeScreenId === screen.id ? "primary" : "default"}
              onClick={() => dispatch(setActiveScreen(screen.id))}
            >
              {screen.title || "Untitled"}
            </Button>
            {task.screens.length > 1 && (
              <Button
                danger
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => dispatch(deleteScreen(screen.id))}
              />
            )}
          </div>
        ))}
      </div>
    </Flex>
  );
};

export default ScreenList;
