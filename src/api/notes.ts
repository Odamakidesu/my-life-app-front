import axios from "axios";
import { Note } from "../types/note";

// APIのベースURL
const API_URL = `${process.env.REACT_APP_API_BASE_URL}/notes`;
const token = localStorage.getItem("token");
/**
 * メモ一覧を取得する
 * @returns Note[] メモの配列
 */
export const fetchNotes = async (): Promise<Note[]> => {
  try {
    const response = await axios.get<Note[]>(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("メモ一覧取得エラー", error);
    throw error; // 呼び出し元でcatchさせる
  }
};

/**
 * 新しいメモを作成する
 * @param title メモのタイトル
 * @param content メモの本文
 * @param tags タグの文字列
 * @param deadline メモの締切（オプション）
 */
export const createNote = async (title: string, content: string, tags: string, created_at: string, deadline?: string | null ): Promise<Note> => {
  try {
    
    const response = await axios.post<Note>(API_URL, {
      title,
      content,
      tags,
      deadline,
      created_at,
    },{
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("メモ作成エラー", error);
    throw error;
  }
};

/**
 * 既存のメモを更新する
 * @param id メモのID
 * @param title 更新後のタイトル
 * @param content 更新後の本文
 * @param tags 更新後のタグ
 * @param deadline 更新後の締切
 */
export const updateNote = async (id: number, title: string, content: string, tags: string, deadline: string): Promise<void> => {
  try {
    console.log("updateNote", id, title, content, tags, deadline);
    await axios.put(`${API_URL}/${id}`, {
      title,
      content,
      tags,
      deadline,
    },{
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
  } catch (error) {
    console.error("メモ更新エラー", error);
    throw error;
  }
};

/**
 * メモを削除する
 * @param id 削除するメモのID
 */
export const deleteNote = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`,{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("メモ削除エラー", error);
    throw error;
  }
};


/**
 * 重要フラグ更新処理
 * @param id メモのID
 * @param isImportant 更新後のタグ
 */
export const updateNoteImportant = async (id: number, isImportant: boolean): Promise<void> => {
  try {
    await axios.put(`${API_URL}/${id}/important`, { important: isImportant },{
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
  } catch (error) {
    console.error("重要フラグ更新エラー", error);
    throw error;
  }
};

/**
 * ピン留め更新処理
 * @param id メモのID
 * @param isPinned 更新後のタグ
 */
export const updateNotePinned = async (id: number, pinned: boolean) => {
  await axios.put(`${API_URL}/${id}/pinned`, { pinned: pinned },{
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
};
/**
 * 完了フラグ更新処理
 * @param id メモのID
 * @param isCompleted 更新後のタグ
 */
export const updateNoteCompleted = async (id: number, isCompleted: boolean) => {
  await axios.put(`${API_URL}/${id}/completed`, { completed: isCompleted },{
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
}
/**
 * メモの削除フラグを更新する
 * @param id メモのID
 * @param delete_flg 削除フラグの値
 */
export const updateNoteDelete = async (id: number): Promise<void> => {
  try {
    await axios.put(`${API_URL}/${id}/deleted`, { delete_flg: true },{
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
  } catch (error) {
    console.error("削除更新エラー", error);
    throw error;
  }
}