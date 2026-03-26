export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="px-6 pt-8 max-w-2xl mx-auto">
      <span className="font-label text-xs tracking-wider uppercase text-outline mb-2 block">
        Project Detail
      </span>
      <h2 className="font-headline font-bold text-[1.75rem] leading-tight text-on-surface">
        Project {id}
      </h2>
      <p className="text-on-surface-variant mt-2 text-lg">
        Project details will appear here.
      </p>
    </div>
  );
}
