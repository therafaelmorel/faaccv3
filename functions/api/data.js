import { currentUser, json } from '../_lib/auth.js';

const projectPriorities = new Set(['low', 'medium', 'high', 'critical']);
const taskStatuses = new Set(['not_started', 'in_progress', 'on_hold', 'needs_review', 'completed']);

async function ensureOperationalSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT, priority TEXT NOT NULL DEFAULT 'medium',
      go_live TEXT, budget REAL, description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL, phase TEXT, priority TEXT NOT NULL DEFAULT 'medium',
      due TEXT, percent INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'not_started', assignees_json TEXT NOT NULL DEFAULT '[]',
      attachments INTEGER NOT NULL DEFAULT 0, description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS task_notes (
      id TEXT PRIMARY KEY, task_id TEXT NOT NULL, user_id TEXT NOT NULL, author_name TEXT NOT NULL,
      content TEXT NOT NULL, created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_notes_task ON task_notes(task_id, created_at)')
  ]);
}

function cleanText(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function parseAssignees(value) {
  const input = Array.isArray(value) ? value : [];
  return [...new Set(input.map(item => cleanText(item, 100)).filter(Boolean))].slice(0, 30);
}

function isAssignedTo(task, user) {
  const name = cleanText(user?.name, 100).toLowerCase();
  return !!name && parseAssignees(task?.assignees).some(assignee => assignee.toLowerCase() === name);
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'The prototype database is not configured.' }, 503);
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Sign in is required.' }, 401);
  await ensureOperationalSchema(env.DB);

  const [projectRows, taskRows, noteRows] = await Promise.all([
    env.DB.prepare(`SELECT id, name, location, priority, go_live AS goLive, budget, description AS desc
      FROM projects ORDER BY created_at DESC`).all(),
    env.DB.prepare(`SELECT id, project_id AS projectId, title, phase, priority, due, percent AS pct, status,
      assignees_json AS assigneesJson, attachments AS attach, description AS desc FROM tasks ORDER BY created_at DESC`).all(),
    env.DB.prepare(`SELECT id, task_id AS taskId, author_name AS author, substr(created_at, 1, 10) AS date, content
      FROM task_notes ORDER BY created_at DESC`).all()
  ]);

  let tasks = (taskRows.results || []).map(task => {
    let assignees = [];
    try { assignees = JSON.parse(task.assigneesJson || '[]'); } catch (error) { assignees = []; }
    const { assigneesJson, ...rest } = task;
    return { ...rest, assignees: Array.isArray(assignees) ? assignees : [] };
  });
  let projects = projectRows.results || [];
  let notes = noteRows.results || [];
  if (user.role === 'team') {
    tasks = tasks.filter(task => isAssignedTo(task, user));
    const taskIds = new Set(tasks.map(task => task.id));
    const projectIds = new Set(tasks.map(task => task.projectId));
    projects = projects.filter(project => projectIds.has(project.id));
    notes = notes.filter(note => taskIds.has(note.taskId));
  }
  return json({ projects, tasks, notes });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'The prototype database is not configured.' }, 503);
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Sign in is required.' }, 401);
  await ensureOperationalSchema(env.DB);

  let input;
  try { input = await request.json(); } catch (error) { return json({ error: 'Invalid data request.' }, 400); }
  const resource = String(input.resource || '');
  const action = String(input.action || '');
  const data = input.data || {};
  const id = cleanText(input.id, 100);
  const now = new Date().toISOString();

  if (resource === 'note' && action === 'create') {
    if (user.role !== 'admin' && user.role !== 'team') return json({ error: 'This role cannot add task notes.' }, 403);
    const taskId = cleanText(data.taskId, 100);
    const content = cleanText(data.content, 2000);
    if (!taskId || !content) return json({ error: 'Task and note text are required.' }, 400);
    if (user.role === 'team') {
      const row = await env.DB.prepare('SELECT assignees_json AS assigneesJson FROM tasks WHERE id = ?').bind(taskId).first();
      let assignees = [];
      try { assignees = JSON.parse(row?.assigneesJson || '[]'); } catch (error) { assignees = []; }
      if (!isAssignedTo({ assignees }, user)) return json({ error: 'This task is not assigned to you.' }, 403);
    }
    const note = { id: crypto.randomUUID(), taskId, author: user.name, date: now.slice(0, 10), content };
    await env.DB.prepare(`INSERT INTO task_notes (id, task_id, user_id, author_name, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`).bind(note.id, taskId, user.id, user.name, content, now).run();
    return json({ note }, 201);
  }

  if (resource === 'task' && action === 'status') {
    if (user.role !== 'admin' && user.role !== 'team') return json({ error: 'This role cannot update tasks.' }, 403);
    const status = taskStatuses.has(data.status) ? data.status : null;
    if (!id || !status) return json({ error: 'Task and valid status are required.' }, 400);
    if (user.role === 'team') {
      const row = await env.DB.prepare('SELECT assignees_json AS assigneesJson FROM tasks WHERE id = ?').bind(id).first();
      let assignees = [];
      try { assignees = JSON.parse(row?.assigneesJson || '[]'); } catch (error) { assignees = []; }
      if (!isAssignedTo({ assignees }, user)) return json({ error: 'This task is not assigned to you.' }, 403);
    }
    const pct = status === 'completed' ? 100 : Math.max(0, Math.min(100, Number(data.pct) || 0));
    await env.DB.prepare('UPDATE tasks SET status = ?, percent = ?, updated_at = ? WHERE id = ?')
      .bind(status, pct, now, id).run();
    return json({ success: true });
  }

  if (user.role !== 'admin') return json({ error: 'Administrator access is required.' }, 403);

  if (resource === 'project' && (action === 'create' || action === 'update')) {
    const project = {
      id: action === 'create' ? crypto.randomUUID() : id,
      name: cleanText(data.name, 160), location: cleanText(data.location, 240), desc: cleanText(data.desc, 2000),
      priority: projectPriorities.has(data.priority) ? data.priority : 'medium',
      goLive: cleanText(data.goLive, 10) || null,
      budget: data.budget === '' || data.budget == null ? null : Number(data.budget)
    };
    if (!project.id || !project.name) return json({ error: 'Project name is required.' }, 400);
    if (action === 'create') {
      await env.DB.prepare(`INSERT INTO projects (id, name, location, priority, go_live, budget, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(project.id, project.name, project.location, project.priority, project.goLive, project.budget, project.desc, now, now).run();
    } else {
      await env.DB.prepare(`UPDATE projects SET name = ?, location = ?, priority = ?, go_live = ?, budget = ?, description = ?, updated_at = ? WHERE id = ?`)
        .bind(project.name, project.location, project.priority, project.goLive, project.budget, project.desc, now, project.id).run();
    }
    return json({ project }, action === 'create' ? 201 : 200);
  }

  if (resource === 'task' && (action === 'create' || action === 'update')) {
    const task = {
      id: action === 'create' ? crypto.randomUUID() : id, projectId: cleanText(data.projectId, 100),
      title: cleanText(data.title, 200), phase: cleanText(data.phase, 160),
      priority: projectPriorities.has(data.priority) ? data.priority : 'medium',
      due: cleanText(data.due, 10) || null, pct: Math.max(0, Math.min(100, Number(data.pct) || 0)),
      status: taskStatuses.has(data.status) ? data.status : 'not_started', assignees: parseAssignees(data.assignees),
      attach: Math.max(0, Number(data.attach) || 0), desc: cleanText(data.desc, 2000)
    };
    if (!task.id || !task.projectId || !task.title) return json({ error: 'Project and task title are required.' }, 400);
    const assigneesJson = JSON.stringify(task.assignees);
    if (action === 'create') {
      await env.DB.prepare(`INSERT INTO tasks (id, project_id, title, phase, priority, due, percent, status, assignees_json, attachments, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(task.id, task.projectId, task.title, task.phase, task.priority, task.due, task.pct, task.status, assigneesJson, task.attach, task.desc, now, now).run();
    } else {
      await env.DB.prepare(`UPDATE tasks SET project_id = ?, title = ?, phase = ?, priority = ?, due = ?, percent = ?, status = ?, assignees_json = ?, attachments = ?, description = ?, updated_at = ? WHERE id = ?`)
        .bind(task.projectId, task.title, task.phase, task.priority, task.due, task.pct, task.status, assigneesJson, task.attach, task.desc, now, task.id).run();
    }
    return json({ task }, action === 'create' ? 201 : 200);
  }

  if (action === 'delete' && id && (resource === 'project' || resource === 'task')) {
    await env.DB.prepare(`DELETE FROM ${resource === 'project' ? 'projects' : 'tasks'} WHERE id = ?`).bind(id).run();
    return json({ success: true });
  }

  return json({ error: 'Unsupported data operation.' }, 400);
}
