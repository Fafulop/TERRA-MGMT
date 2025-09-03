# Gantt Chart Feature Documentation

## Overview

The Gantt Chart feature provides global project management capabilities, allowing any authenticated user to view and manage task timelines for all tasks in the system. This enables teams to coordinate project schedules and track dependencies across different task owners.

## Features

### ✅ Implemented Features

- **Global Task View**: All authenticated users can see all tasks regardless of ownership
- **Timeline Management**: Set start and end dates for any task
- **Task Duration Calculation**: Automatic calculation of task duration in days
- **Editable Entries**: Modify existing task timelines through a clean interface
- **Task Filtering**: Separate views for tasks with and without timeline data
- **User Information**: Display task owner details (username, full name)
- **Real-time Updates**: Changes are immediately reflected in the interface
- **Data Validation**: Prevent invalid date ranges and provide clear error messages

### 🚧 Future Enhancements

- **Visual Gantt Chart**: Replace table view with actual timeline visualization
- **Task Dependencies**: Visual dependency arrows and relationship management
- **Drag and Drop**: Interactive timeline adjustment
- **Critical Path**: Automatic critical path calculation and highlighting
- **Resource Management**: Assign and track team member workload
- **Export Functionality**: Export Gantt charts to PDF, Excel, or image formats
- **Milestone Tracking**: Add milestone markers to project timeline

## Architecture

### Backend Structure

```
backend/src/
├── controllers/
│   ├── taskController.ts      # User-specific task operations
│   └── ganttController.ts     # Global Gantt operations
├── routes/
│   ├── tasks.ts              # /api/tasks/* routes
│   └── gantt.ts              # /api/gantt/* routes  
└── middleware/
    └── auth.ts               # JWT authentication
```

### Frontend Structure

```
frontend/src/
├── pages/
│   └── GanttChart.tsx        # Main Gantt chart component
├── services/
│   └── gantt.ts              # API service layer
└── types/
    └── index.ts              # TypeScript interfaces
```

### Database Schema

```sql
-- Existing tasks table extended with timeline fields
ALTER TABLE tasks 
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;

-- New table for task dependencies
CREATE TABLE task_dependencies (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) DEFAULT 'finish_to_start',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
  CONSTRAINT unique_dependency UNIQUE (task_id, depends_on_task_id)
);
```

## API Endpoints

### Gantt-Specific Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gantt/tasks` | Get all tasks for Gantt view |
| PUT | `/api/gantt/tasks/:id/timeline` | Update task timeline |
| POST | `/api/gantt/dependencies` | Create task dependency |
| DELETE | `/api/gantt/dependencies/:id` | Delete task dependency |

### Regular Task Endpoints (User-Specific)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get user's own tasks |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/:id` | Update user's task |
| DELETE | `/api/tasks/:id` | Delete user's task |

## Security Model

### Two-Tier Security

1. **Regular Tasks**: User-specific operations
   - Users can only view/edit their own tasks
   - Enforced at database level with `user_id` filters
   - Used for personal task management

2. **Gantt Operations**: Global project management
   - Any authenticated user can view/edit any task timeline
   - Designed for collaborative project planning
   - Maintains audit trail of who made changes

### Authentication

All endpoints require JWT authentication:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## Usage Guide

### For Users

1. **Access Gantt Chart**:
   - Navigate to Dashboard → Click "View Gantt Chart"
   - Or go directly to `/gantt` route

2. **Add Task to Timeline**:
   - Click "Add Entry" button
   - Select task from dropdown
   - Choose start and end dates
   - Click "Add to Gantt"

3. **Edit Existing Timeline**:
   - Find task in the Gantt entries table
   - Click "Edit Dates"
   - Modify dates in the form
   - Click "Update"

4. **View Task Information**:
   - See task owner, area, status, and duration
   - Click "View Task" to see full task details

### For Developers

1. **Adding New Gantt Features**:
   ```typescript
   // Add to ganttService.ts
   async newGanttFeature(params: any, token: string) {
     // Implementation
   }
   ```

2. **Database Migrations**:
   ```sql
   -- Use /api/migrate/add-gantt-fields endpoint
   -- Or run SQL manually in database
   ```

3. **API Integration**:
   ```typescript
   import { ganttService } from '../services/gantt';
   
   const tasks = await ganttService.getGanttTasks(token);
   ```

## Component Structure

### GanttChart.tsx Architecture

```typescript
interface GanttEntry {
  taskId: number;
  startDate: string;
  endDate: string;
}

const GanttChart = () => {
  // State management
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  // Data fetching
  const { data: tasks } = useQuery(['gantt-tasks'], () => 
    ganttService.getGanttTasks(token!)
  );
  
  // Mutations
  const updateTaskDatesMutation = useMutation({
    mutationFn: ({ taskId, startDate, endDate }) =>
      ganttService.updateTaskTimeline(taskId, startDate, endDate, token!),
    onSuccess: () => queryClient.invalidateQueries(['gantt-tasks'])
  });
  
  // UI rendering...
};
```

## Data Flow

### Task Timeline Update Flow

1. **User Action**: User selects task and enters dates
2. **Frontend Validation**: Check date validity and requirements
3. **API Call**: `PUT /api/gantt/tasks/:id/timeline`
4. **Backend Validation**: Verify dates and task existence
5. **Database Update**: Update `start_date` and `end_date` fields
6. **Response**: Return updated task information
7. **UI Update**: Refresh task list with new data

### Data Filtering Logic

```typescript
// Tasks with timeline data (shown in Gantt table)
const ganttTasks = taskList.filter(task => 
  task.startDate && task.endDate
);

// Tasks available for scheduling (shown in dropdown)
const availableTasks = taskList.filter(task => 
  !task.startDate || !task.endDate
);
```

## Error Handling

### Common Error Scenarios

1. **Invalid Date Range**:
   ```json
   { "error": "Start date cannot be after end date" }
   ```

2. **Task Not Found**:
   ```json
   { "error": "Task not found" }
   ```

3. **Authentication Error**:
   ```json
   { "error": "User not authenticated" }
   ```

4. **Circular Dependency**:
   ```json
   { "error": "This dependency would create a circular dependency" }
   ```

## Performance Considerations

### Database Optimization

- **Indexes**: Added on `start_date`, `end_date`, and dependency columns
- **Query Optimization**: Single query fetches all needed task data
- **Connection Pooling**: PostgreSQL connection pool for concurrent requests

### Frontend Optimization

- **React Query**: Caching and automatic refetching
- **Lazy Loading**: Component lazy-loaded to reduce initial bundle size
- **Optimistic Updates**: UI updates immediately, syncs with server

### Caching Strategy

```typescript
// Cache Gantt tasks separately from user tasks
queryKey: ['gantt-tasks']  // Global task view
queryKey: ['tasks']        // User-specific tasks
```

## Testing

### API Testing

```bash
# Get all tasks
curl -H "Authorization: Bearer <token>" \
     http://localhost:5000/api/gantt/tasks

# Update timeline
curl -X PUT \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"startDate": "2025-09-01", "endDate": "2025-09-15"}' \
     http://localhost:5000/api/gantt/tasks/1/timeline
```

### Frontend Testing

1. **Manual Testing Checklist**:
   - [ ] Can access Gantt page from Dashboard
   - [ ] All tasks load properly
   - [ ] Can select task and add dates
   - [ ] Date validation works
   - [ ] Can edit existing entries
   - [ ] Duration calculation is correct
   - [ ] Error messages display properly

## Troubleshooting

### Common Issues

1. **"No tasks available"**:
   - Check if backend server is running
   - Verify API endpoint is accessible
   - Check browser console for errors

2. **"Task not found or unauthorized"**:
   - Ensure Gantt migration was run
   - Check if task ID exists in database
   - Verify JWT token is valid

3. **Timeline not updating**:
   - Check network tab for API call status
   - Verify date format is correct
   - Ensure React Query cache is invalidating

### Debug Mode

Enable debug logging by uncommenting console.log statements in:
- `ganttController.ts` - Backend operations
- `GanttChart.tsx` - Frontend operations
- `gantt.ts` service - API calls

## Migration Guide

### From Previous Version

If upgrading from a version without Gantt functionality:

1. **Run Database Migration**:
   ```bash
   curl -X POST http://localhost:5000/api/migrate/add-gantt-fields
   ```

2. **Restart Backend Server**:
   ```bash
   npm run dev
   ```

3. **Clear Browser Cache**:
   - Hard refresh frontend (Ctrl+Shift+R)

## Contributing

### Adding New Features

1. **Backend Changes**:
   - Add endpoint to `ganttController.ts`
   - Update routes in `gantt.ts`
   - Add database migrations if needed

2. **Frontend Changes**:
   - Update `ganttService.ts` with new API calls
   - Modify `GanttChart.tsx` component
   - Add new TypeScript interfaces

3. **Documentation**:
   - Update API documentation
   - Add usage examples
   - Update this README

### Code Standards

- **TypeScript**: All new code must be fully typed
- **Error Handling**: Implement proper error boundaries
- **Testing**: Add unit tests for new functionality
- **Documentation**: Include JSDoc comments for functions