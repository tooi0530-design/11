export interface Task {
  id: string;
  text: string;
  isCompleted: boolean; // true = O, false = X
  createdAt: number;
}

export interface TaskMap {
  [date: string]: Task[];
}

export enum CompletionStatus {
  O = 'O',
  X = 'X'
}
