/** ユースケースの実行結果を利用者に伝えるための通知ポート */
export type NotificationVariant = "success" | "danger" | "info" | "warning";

export type Notifier = (message: string, variant: NotificationVariant) => void;
