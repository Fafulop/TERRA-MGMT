import { useReducer, useCallback } from 'react';

// Define the shape of our Gantt state
interface GanttState {
  // Form states
  showAddForm: boolean;
  selectedTaskId: number | null;
  startDate: string;
  endDate: string;
  editingEntry: { taskId: number; startDate: string; endDate: string } | null;
  
  // UI states
  expandedTasks: Set<number>;
  showCalendar: Set<number>;
  
  // Subtask form states
  showAddSubtaskForm: number | null;
  subtaskFormData: {
    name: string;
    description: string;
    status: 'pending' | 'completed';
    assignee: string;
    referenceType: 'task' | 'subtask' | '';
    referenceId: number | undefined;
    referenceName: string;
    startDate: string;
    endDate: string;
  };
}

// Define action types
type GanttAction =
  | { type: 'TOGGLE_ADD_FORM'; payload?: boolean }
  | { type: 'SET_SELECTED_TASK'; payload: number | null }
  | { type: 'SET_DATES'; payload: { startDate: string; endDate: string } }
  | { type: 'SET_EDITING_ENTRY'; payload: { taskId: number; startDate: string; endDate: string } | null }
  | { type: 'TOGGLE_TASK_EXPANSION'; payload: number }
  | { type: 'TOGGLE_CALENDAR'; payload: number }
  | { type: 'SET_SUBTASK_FORM'; payload: number | null }
  | { type: 'UPDATE_SUBTASK_FORM'; payload: Partial<GanttState['subtaskFormData']> }
  | { type: 'RESET_SUBTASK_FORM' }
  | { type: 'RESET_FORM' };

// Initial state
const initialState: GanttState = {
  showAddForm: false,
  selectedTaskId: null,
  startDate: '',
  endDate: '',
  editingEntry: null,
  expandedTasks: new Set(),
  showCalendar: new Set(),
  showAddSubtaskForm: null,
  subtaskFormData: {
    name: '',
    description: '',
    status: 'pending',
    assignee: '',
    referenceType: '',
    referenceId: undefined,
    referenceName: '',
    startDate: '',
    endDate: ''
  }
};

// Reducer function
function ganttReducer(state: GanttState, action: GanttAction): GanttState {
  switch (action.type) {
    case 'TOGGLE_ADD_FORM':
      return {
        ...state,
        showAddForm: action.payload ?? !state.showAddForm
      };

    case 'SET_SELECTED_TASK':
      return {
        ...state,
        selectedTaskId: action.payload
      };

    case 'SET_DATES':
      return {
        ...state,
        startDate: action.payload.startDate,
        endDate: action.payload.endDate
      };

    case 'SET_EDITING_ENTRY':
      return {
        ...state,
        editingEntry: action.payload,
        showAddForm: action.payload !== null,
        selectedTaskId: action.payload?.taskId || null,
        startDate: action.payload?.startDate || '',
        endDate: action.payload?.endDate || ''
      };

    case 'TOGGLE_TASK_EXPANSION':
      const newExpanded = new Set(state.expandedTasks);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return {
        ...state,
        expandedTasks: newExpanded
      };

    case 'TOGGLE_CALENDAR':
      const newCalendar = new Set(state.showCalendar);
      if (newCalendar.has(action.payload)) {
        newCalendar.delete(action.payload);
      } else {
        newCalendar.add(action.payload);
      }
      return {
        ...state,
        showCalendar: newCalendar
      };

    case 'SET_SUBTASK_FORM':
      return {
        ...state,
        showAddSubtaskForm: action.payload
      };

    case 'UPDATE_SUBTASK_FORM':
      return {
        ...state,
        subtaskFormData: {
          ...state.subtaskFormData,
          ...action.payload
        }
      };

    case 'RESET_SUBTASK_FORM':
      return {
        ...state,
        subtaskFormData: initialState.subtaskFormData,
        showAddSubtaskForm: null
      };

    case 'RESET_FORM':
      return {
        ...state,
        showAddForm: false,
        selectedTaskId: null,
        startDate: '',
        endDate: '',
        editingEntry: null
      };

    default:
      return state;
  }
}

export const useGanttState = () => {
  const [state, dispatch] = useReducer(ganttReducer, initialState);

  // Action creators for better usability
  const actions = {
    toggleAddForm: useCallback((show?: boolean) => {
      dispatch({ type: 'TOGGLE_ADD_FORM', payload: show });
    }, []),

    setSelectedTask: useCallback((taskId: number | null) => {
      dispatch({ type: 'SET_SELECTED_TASK', payload: taskId });
    }, []),

    setDates: useCallback((startDate: string, endDate: string) => {
      dispatch({ type: 'SET_DATES', payload: { startDate, endDate } });
    }, []),

    setEditingEntry: useCallback((entry: { taskId: number; startDate: string; endDate: string } | null) => {
      dispatch({ type: 'SET_EDITING_ENTRY', payload: entry });
    }, []),

    toggleTaskExpansion: useCallback((taskId: number) => {
      dispatch({ type: 'TOGGLE_TASK_EXPANSION', payload: taskId });
    }, []),

    toggleCalendar: useCallback((taskId: number) => {
      dispatch({ type: 'TOGGLE_CALENDAR', payload: taskId });
    }, []),

    setSubtaskForm: useCallback((taskId: number | null) => {
      dispatch({ type: 'SET_SUBTASK_FORM', payload: taskId });
    }, []),

    updateSubtaskForm: useCallback((data: Partial<GanttState['subtaskFormData']>) => {
      dispatch({ type: 'UPDATE_SUBTASK_FORM', payload: data });
    }, []),

    resetSubtaskForm: useCallback(() => {
      dispatch({ type: 'RESET_SUBTASK_FORM' });
    }, []),

    resetForm: useCallback(() => {
      dispatch({ type: 'RESET_FORM' });
    }, [])
  };

  return { state, actions };
};