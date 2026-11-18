import type { ReactNode } from 'react';
import './SectionHeading.css';

interface SectionHeadingProps {
  tag: string;
  title: string;
  description: string;
  source?: ReactNode;
}

export default function SectionHeading({ tag, title, description, source }: SectionHeadingProps) {
  return (
    <div className="section-head">
      <div className="tag">{tag}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {source && <p className="section-source">Fonte: {source}</p>}
    </div>
  );
}
