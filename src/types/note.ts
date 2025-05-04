export type Note = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  tags?: string;
  isImportant?: boolean;
  isPinned?: boolean;
  isCompleted?: boolean;
  deadline?: string;
  delete_flg?: boolean;
};