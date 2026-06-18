import Link from "next/link";
import type { LifeRecord, StudyItem, WorkProject } from "@/lib/types";

export function LifeRecordCard({ record }: { record: LifeRecord }) {
  return (
    <article className="card feed-card">
      <Link href={`/life/${record.id}`} aria-label={record.title}>
        <div className={`photo ${record.imageTone}`} />
      </Link>
      <div className="card-body">
        <h3>{record.title}</h3>
        <p>{record.excerpt}</p>
        <div className="chips">
          {record.tags.slice(0, 3).map((tag, index) => (
            <span className={`chip ${index === 1 ? "cyan" : index === 2 ? "lime" : ""}`} key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function StudyCard({ item }: { item: StudyItem }) {
  return (
    <article className="card">
      <div className="card-body">
        <span className="chip cyan">{item.type}</span>
        <h3 style={{ marginTop: 14 }}>{item.title}</h3>
        <p>{item.summary}</p>
        <div className="chips">
          {item.tags.map((tag) => (
            <span className="chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function WorkProjectCard({ project }: { project: WorkProject }) {
  return (
    <article className="card">
      <Link href={`/work/${project.id}`} aria-label={project.title}>
        <div className={`photo ${project.imageTone}`} />
      </Link>
      <div className="card-body">
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <div className="chips">
          {project.techStack.slice(0, 4).map((tech, index) => (
            <span className={`chip ${index % 2 === 0 ? "cyan" : "lime"}`} key={tech}>
              {tech}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
