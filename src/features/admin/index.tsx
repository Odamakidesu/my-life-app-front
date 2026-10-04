import React from "react";
import { Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAdminUsers } from "features/admin/hooks/useAdminUsers";
import { useCurrentUser } from "features/auth/hooks/useAuth";
import { UserRole } from "features/auth/types/types";
import { ThemeName } from "shared/types/theme";
import ToastNotifier from "shared/components/ToastNotifier";
import { useToast } from "shared/hooks/useToast";

type AdminPageProps = {
  theme: ThemeName;
};

/**
 * 管理画面。利用者の権限（一般・管理者）と有効・無効を切り替える。
 * 自分自身の行は変更できない（サーバも 400 で拒否する）。
 */
const AdminPage: React.FC<AdminPageProps> = ({ theme }) => {
  const { message, variant, isVisible, showToast, hideToast } = useToast();
  const { users, isLoading, isForbidden, changeRole, changeEnabled } = useAdminUsers(showToast);
  const currentUser = useCurrentUser();

  return (
    <div className="container mt-4" data-bs-theme={theme}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">管理画面</h2>
        <Link to="/notes" className="btn btn-outline-primary">
          メモ一覧へ戻る
        </Link>
      </div>

      {isForbidden ? (
        <div className="alert alert-warning">この画面は管理者だけが使えます。</div>
      ) : isLoading ? (
        <div className="d-flex justify-content-center" style={{ minHeight: "40vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">読み込み中...</span>
          </div>
        </div>
      ) : (
        <Table responsive hover className="align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>ユーザー名</th>
              <th>権限</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = currentUser?.id === user.id;
              return (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    {user.username}
                    {isSelf && <span className="badge bg-secondary ms-2">あなた</span>}
                  </td>
                  <td style={{ maxWidth: "160px" }}>
                    <Form.Select
                      size="sm"
                      aria-label={`${user.username} の権限`}
                      value={user.role}
                      disabled={isSelf}
                      onChange={(e) => void changeRole(user, e.target.value as UserRole)}
                    >
                      <option value="USER">一般</option>
                      <option value="ADMIN">管理者</option>
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Check
                      type="switch"
                      id={`enabled-${user.id}`}
                      label={user.enabled ? "有効" : "無効"}
                      aria-label={`${user.username} を有効にする`}
                      checked={user.enabled}
                      disabled={isSelf}
                      onChange={(e) => void changeEnabled(user, e.target.checked)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <ToastNotifier message={message} variant={variant} isVisible={isVisible} onClose={hideToast} />
    </div>
  );
};

export default AdminPage;
