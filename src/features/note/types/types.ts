/** メモ（Note）の型定義 */

export type NoteId = number;

/**
 * ドメインが扱うメモ。
 * API のフィールド名（スネークケース）や削除フラグといった永続化の都合は
 * infrastructure 層のスキーマで吸収し、ここには持ち込まない。
 */
export type Note = {
  id: NoteId;
  title: string;
  content: string;
  createdAt: string;
  tags?: string;
  isImportant?: boolean;
  isPinned?: boolean;
  isCompleted?: boolean;
  deadline?: string;
  /** 繰り返しの間隔。未設定は繰り返さない */
  recurrence?: Recurrence;
  /** ゴミ箱に入れた日時（ゴミ箱のメモだけが持つ） */
  deletedAt?: string;
};

/** 繰り返しの間隔。完了にすると次の締切のメモがサーバで作られる */
export type Recurrence = "DAILY" | "WEEKLY" | "MONTHLY";

/**
 * 新規メモの作成に必要な入力値。
 *
 * createdAt は持たない。作成日時と所有者はサーバが決めるため、
 * クライアントが送っても無視される。
 */
export type NewNote = {
  title: string;
  content: string;
  tags: string;
  deadline?: string | null;
  recurrence: Recurrence | null;
};

/** 既存メモの更新に必要な入力値 */
export type NoteEdit = {
  title: string;
  content: string;
  tags: string;
  deadline: string;
  recurrence: Recurrence | null;
};

/** 締切の状態 */
export type DeadlineStatus = "none" | "overdue" | "dueSoon" | "scheduled";

export type NoteFilterOptions = {
  tags: string[];
  onlyPinned: boolean;
  onlyImportant: boolean;
  includeCompleted: boolean;
  includeUncompleted: boolean;
};

export type NoteFilterCriteria = NoteFilterOptions & {
  searchQuery: string;
};

/** 一覧の並べ替え */
export type NoteSort = "PRIORITY" | "DEADLINE" | "CREATED";

/** 締切による絞り込み（どちらも未完了のメモだけ） */
export type DueFilter = "OVERDUE" | "SOON";

/**
 * サーバに渡す一覧の検索条件。未指定の項目は絞り込まない。
 * 絞り込みと並べ替えはサーバが行い、画面は必要なページだけを受け取る。
 */
export type NoteQuery = {
  keyword: string;
  tags: string[];
  onlyPinned: boolean;
  onlyImportant: boolean;
  /** true なら完了済みだけ、false なら未完了だけ、undefined なら両方 */
  completed?: boolean;
  due?: DueFilter;
  sort: NoteSort;
};

/** 検索結果の1ページ分 */
export type NotePage = {
  notes: Note[];
  /** 条件に合うメモの総数 */
  total: number;
};

/** 一覧の上部に出す集計 */
export type NoteSummary = {
  total: number;
  overdue: number;
  dueSoon: number;
};

export type ExportFormat = "json" | "csv";

/** エクスポートしたファイル */
export type ExportedFile = {
  fileName: string;
  content: Blob;
};

export interface NoteRepository {
  /** 条件に合うメモを1ページ分取得する */
  search(query: NoteQuery, page: number, size: number): Promise<NotePage>;
  summarize(): Promise<NoteSummary>;
  exportAll(format: ExportFormat): Promise<ExportedFile>;
  create(note: NewNote): Promise<Note>;
  update(id: NoteId, note: NoteEdit): Promise<void>;
  updateImportant(id: NoteId, isImportant: boolean): Promise<void>;
  updatePinned(id: NoteId, isPinned: boolean): Promise<void>;
  /** 完了状態を変える。繰り返しのメモを完了にした場合は作られた次回分の ID を返す */
  updateCompleted(id: NoteId, isCompleted: boolean): Promise<NoteId | null>;
  markAsDeleted(id: NoteId): Promise<void>;
  /** ゴミ箱（論理削除済み）のメモを全件取得する */
  findDeleted(): Promise<Note[]>;
  /** ゴミ箱から一覧へ戻す */
  restore(id: NoteId): Promise<void>;
  /** ゴミ箱のメモを完全に削除する（ゴミ箱に無いメモはサーバが 404 を返す） */
  deletePermanently(id: NoteId): Promise<void>;
}
