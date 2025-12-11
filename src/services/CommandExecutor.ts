import { useSparkStore } from '../store';
import { ParsedCommand } from './GeminiCommandParser';

export const CommandExecutor = {
  execute: async (command: ParsedCommand): Promise<{ success: boolean; message: string }> => {
    const { getSparkData, setSparkData } = useSparkStore.getState();

    try {
      switch (command.targetSpark) {
        case 'todo':
          return handleTodoCommand(command, getSparkData, setSparkData);
        case 'weight-tracker':
          return handleWeightCommand(command, getSparkData, setSparkData);
        case 'toview':
          return handleToviewCommand(command, getSparkData, setSparkData);
        // Add other cases as implemented
        default:
          if (command.targetSpark === 'unknown') {
            const errorMsg = command.params?.error ? ` (${command.params.error})` : '';
            return { success: false, message: `I didn't understand that command${errorMsg}.` };
          }
          return { success: false, message: `Spark '${command.targetSpark}' not supported yet.` };
      }
    } catch (error: any) {
      console.error('Command execution error:', error);
      return { success: false, message: `Execution failed: ${error.message}` };
    }
  }
};

function handleTodoCommand(
  command: ParsedCommand,
  getSparkData: (id: string) => any,
  setSparkData: (id: string, data: any) => void
) {
  if (command.action !== 'create') {
    return { success: false, message: 'Only "create" action is supported for Todo List.' };
  }

  const { text, category, dueDate } = command.params;

  if (!text) {
    return { success: false, message: 'Missing todo text.' };
  }

  const currentData = getSparkData('todo') || {};
  const todos = currentData.todos || [];

  const newId = Math.max(...(todos as any[]).map((t: any) => t.id), 0) + 1;
  const today = new Date().toISOString().split('T')[0];

  // Calculate due date
  let finalDueDate = today;
  if (dueDate === 'tomorrow') {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    finalDueDate = tmr.toISOString().split('T')[0];
  } else if (dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    finalDueDate = dueDate;
  }

  const newTodo = {
    id: newId,
    text: text, // Raw text
    displayText: text, // Assuming parser separates properly, or we just use raw
    category: category,
    completed: false,
    dueDate: finalDueDate,
    createdDate: new Date().toISOString(),
    sortTimeMs: Date.now(),
  };

  setSparkData('todo', {
    ...currentData,
    todos: [...todos, newTodo],
    lastUpdated: new Date().toISOString(),
  });

  return { success: true, message: `Added todo: "${text}"` };
};

function handleWeightCommand(
  command: ParsedCommand,
  getSparkData: (id: string) => any,
  setSparkData: (id: string, data: any) => void
) {
  if (command.action !== 'add') {
    return { success: false, message: 'Only "add" action is supported for Weight Tracker.' };
  }

  const { weight, unit } = command.params;

  if (!weight) {
    return { success: false, message: 'Missing weight value.' };
  }

  const currentData = getSparkData('weight-tracker') || {};
  const entries = currentData.entries || [];

  const newEntry = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    weight: parseFloat(weight),
  };

  const updatedData = {
    ...currentData,
    entries: [...entries, newEntry]
  };

  if (unit && (unit === 'kg' || unit === 'lbs')) {
    updatedData.unit = unit;
  }

  setSparkData('weight-tracker', updatedData);

  return { success: true, message: `Recorded weight: ${weight} ${unit || ''}` };
};

function handleToviewCommand(
  command: ParsedCommand,
  getSparkData: (id: string) => any,
  setSparkData: (id: string, data: any) => void
) {
  if (command.action !== 'add') {
    return { success: false, message: 'Only "add" action is supported for ToView.' };
  }

  const { title, type, provider, watchWith } = command.params;

  if (!title) {
    return { success: false, message: 'Missing title.' };
  }

  const category = type || 'Movie';
  // Construct text like "Movie: Title (Person)" so regex in ToviewSpark works if needed, 
  // but we are creating the object directly so it's less critical, 
  // however maintaining the formatting in `text` field is good for UI consistency if it uses text.
  let formattedText = `${category}: ${title}`;
  if (watchWith && watchWith.length > 0) {
    formattedText += ` (${watchWith.join(', ')})`;
  }

  const currentData = getSparkData('toview') || {};
  const toviews = currentData.toviews || [];

  const newToview = {
    id: Date.now(),
    text: formattedText,
    completed: false,
    viewDate: new Date().toISOString().split('T')[0],
    createdDate: new Date().toISOString().split('T')[0],
    category: category,
    displayText: title,
    provider: provider,
    watchWith: watchWith,
    sortTimeMs: Date.now()
  };

  setSparkData('toview', {
    ...currentData,
    toviews: [...toviews, newToview]
  });

  return { success: true, message: `Added to list: "${title}"` };
};
