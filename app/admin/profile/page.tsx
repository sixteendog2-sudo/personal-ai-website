import { profile } from "@/lib/mock-data";

export default function AdminProfilePage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">个人资料</div>
          <h1>维护公开介绍和 AI 可引用资料</h1>
        </div>
        <button className="button">保存</button>
      </header>
      <section className="admin-card">
        <div className="form-grid">
          <div className="field">
            <label>昵称</label>
            <input defaultValue={profile.nickname} />
          </div>
          <div className="field">
            <label>城市</label>
            <input defaultValue={profile.city} />
          </div>
          <div className="field">
            <label>一句话介绍</label>
            <input defaultValue={profile.headline} />
          </div>
          <div className="field">
            <label>邮箱</label>
            <input defaultValue={profile.contact.email} />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>个人简介</label>
            <textarea defaultValue={profile.bio} />
          </div>
        </div>
        <div className="chips">
          <span className="chip">公开展示</span>
          <span className="chip cyan">可用于 AI 回答</span>
          <span className="chip lime">已发布</span>
        </div>
      </section>
    </>
  );
}

