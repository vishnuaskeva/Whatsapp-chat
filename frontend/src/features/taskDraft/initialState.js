export const createEmptyField = (type = "text") => ({
  id: crypto.randomUUID(),
  type,
  label: "",
  required: false,
  config: {
    inputType: "text",
    options: [],
    multiple: false,
    fileType: "image",
    fileUrl: "",
  },
});

export const createEmptyScreen = () => ({
  id: crypto.randomUUID(),
  title: "Untitled Screen",
  fields: [],
});

export const createInitialTaskDraft = () => {
  const firstScreenId = `screen-${Date.now()}`;
  return {
    isOpen: false,
    task: {
      title: "",
      screens: [
        {
          id: firstScreenId,
          title: "Screen 1",
          fields: [],
        },
      ],
    },
    activeScreenId: firstScreenId,
  };
};

const initialTaskDraftState = createInitialTaskDraft();

export default initialTaskDraftState;
