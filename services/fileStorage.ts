import { Task, TaskMap } from '../types';

export const loadAllTasksFromDirectory = async (dirHandle: any): Promise<TaskMap> => {
  const newTasks: TaskMap = {};
  
  try {
    // Iterate through all files in the directory
    // @ts-ignore - File System Access API types might not be fully available in all envs
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.json')) {
        const dateKey = entry.name.replace('.json', '');
        
        // Validate filename format YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
          const file = await entry.getFile();
          const text = await file.text();
          try {
            const tasks = JSON.parse(text);
            if (Array.isArray(tasks)) {
              newTasks[dateKey] = tasks;
            }
          } catch (e) {
            console.error(`Error parsing ${entry.name}`, e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error reading directory:", error);
    throw error;
  }
  
  return newTasks;
};

export const saveTasksToDirectory = async (dirHandle: any, dateKey: string, tasks: Task[]) => {
  if (!dirHandle) return;

  try {
    // @ts-ignore
    const fileHandle = await dirHandle.getFileHandle(`${dateKey}.json`, { create: true });
    // @ts-ignore
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(tasks, null, 2));
    await writable.close();
  } catch (e) {
    console.error(`Error saving tasks for ${dateKey}`, e);
    throw e;
  }
};

export const deleteFileFromDirectory = async (dirHandle: any, dateKey: string) => {
    if (!dirHandle) return;
    try {
        // @ts-ignore
        await dirHandle.removeEntry(`${dateKey}.json`);
    } catch (e) {
        // Ignore if file doesn't exist
        console.log(`File for ${dateKey} might not exist or couldn't be deleted`, e);
    }
}
