-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  area VARCHAR(255) NOT NULL,
  subarea VARCHAR(255),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Visibility control
  visibility VARCHAR(20) DEFAULT 'shared' CHECK (visibility IN ('shared', 'private')),

  -- Project dates (auto-calculated from tasks)
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,

  -- Status
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'on_hold')),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project Tasks Join Table
CREATE TABLE IF NOT EXISTS project_tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- Gantt-specific dates
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Display order in Gantt chart
  display_order INTEGER DEFAULT 0,

  -- Metadata
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  added_by INTEGER NOT NULL REFERENCES users(id),

  UNIQUE(project_id, task_id)
);

-- Indexes for projects table
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_area ON projects(area);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);

-- Indexes for project_tasks table
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_task_id ON project_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_dates ON project_tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_display_order ON project_tasks(project_id, display_order);

-- Trigger for auto-update timestamps on projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add start_date column to tasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'tasks' AND column_name = 'start_date') THEN
    ALTER TABLE tasks ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add index on tasks start_date
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);

-- Comments for documentation
COMMENT ON TABLE projects IS 'Projects for Gantt chart visualization and timeline management';
COMMENT ON TABLE project_tasks IS 'Join table linking tasks to projects with Gantt-specific dates';
COMMENT ON COLUMN projects.visibility IS 'Controls whether project is visible to all users (shared) or only owner (private)';
COMMENT ON COLUMN projects.start_date IS 'Auto-calculated earliest start date from project tasks';
COMMENT ON COLUMN projects.end_date IS 'Auto-calculated latest end date from project tasks';
COMMENT ON COLUMN project_tasks.display_order IS 'Order in which tasks appear in Gantt chart (0 = first)';
