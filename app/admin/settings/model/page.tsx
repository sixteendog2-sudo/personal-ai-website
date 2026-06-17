export default function AdminModelSettingsPage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">模型设置</div>
          <h1>DeepSeek API 与后续多模型配置</h1>
        </div>
        <button className="button">保存设置</button>
      </header>
      <section className="admin-card">
        <div className="form-grid">
          <div className="field">
            <label>模型供应商</label>
            <input defaultValue="deepseek" />
          </div>
          <div className="field">
            <label>Base URL</label>
            <input defaultValue="https://api.deepseek.com" />
          </div>
          <div className="field">
            <label>聊天模型</label>
            <input defaultValue="deepseek-v4-flash" />
          </div>
          <div className="field">
            <label>API Key</label>
            <input defaultValue="••••••••••••••••" />
          </div>
          <div className="field">
            <label>Temperature</label>
            <input defaultValue="0.7" />
          </div>
          <div className="field">
            <label>最大 Tokens</label>
            <input defaultValue="1200" />
          </div>
        </div>
      </section>
    </>
  );
}

