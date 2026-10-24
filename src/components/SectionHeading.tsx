import './SectionHeading.css';

interface SectionHeadingProps {
  tag: string;
  title: string;
  description: string;
}

export default function SectionHeading({ tag, title, description }: SectionHeadingProps) {
  return (
    <div className="section-head">
      <div className="tag">{tag}</div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
