import Link from "next/link";
import { ImageCarousel } from "@/components/ImageCarousel";
import type { LifeRecord, StudyItem, WorkProject } from "@/lib/types";

export function LifeRecordCard({ record }: { record: LifeRecord }) {
  return (
    <article className="card content-card feed-card">
      <ImageCarousel images={record.images ?? []} title={record.title} href={`/life/${record.id}`} tone={record.imageTone} />
      <Link className="card-link" href={`/life/${record.id}`} aria-label={record.title}>
        <div className="card-body">
          <div className="card-copy">
            <span className="card-kicker">生活记录</span>
            <h3>{record.title}</h3>
            <p>{record.excerpt}</p>
          </div>
          <div className="chips card-tags" aria-label="生活标签">
            {record.tags.slice(0, 3).map((tag, index) => (
              <span className={`chip ${index === 1 ? "cyan" : index === 2 ? "lime" : ""}`} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function StudyCard({ item }: { item: StudyItem }) {
  return (
    <article className="card content-card">
      <ImageCarousel images={item.images ?? []} title={item.title} href={`/study/${item.id}`} />
      <Link className="card-link" href={`/study/${item.id}`} aria-label={item.title}>
        <div className="card-body">
          <div className="card-copy">
            <span className="card-kicker cyan">{item.type}</span>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
          </div>
          <div className="chips card-tags" aria-label="学习标签">
            {item.tags.slice(0, 4).map((tag) => (
              <span className="chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function WorkProjectCard({ project }: { project: WorkProject }) {
  return (
    <article className="card content-card">
      <ImageCarousel images={project.images ?? []} title={project.title} href={`/work/${project.id}`} tone={project.imageTone} />
      <Link className="card-link" href={`/work/${project.id}`} aria-label={project.title}>
        <div className="card-body">
          <div className="card-copy">
            <span className="card-kicker coral">工作项目</span>
            <h3>{project.title}</h3>
            <p>{project.summary}</p>
          </div>
          <div className="chips card-tags" aria-label="技术标签">
            {project.techStack.slice(0, 4).map((tech, index) => (
              <span className={`chip ${index % 2 === 0 ? "cyan" : "lime"}`} key={tech}>
                {tech}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
