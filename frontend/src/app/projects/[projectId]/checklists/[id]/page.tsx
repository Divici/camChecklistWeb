export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ projectId: string; id: string }>;
}) {
  const { projectId, id } = await params;

  return (
    <div className="px-6 pt-8 max-w-2xl mx-auto">
      <span className="font-label text-xs tracking-wider uppercase text-outline mb-2 block">
        Checklist
      </span>
      <h2 className="font-headline font-bold text-[1.75rem] leading-tight text-on-surface">
        Checklist {id}
      </h2>
      <p className="text-on-surface-variant mt-2 text-lg">
        Checklist for project {projectId} will appear here.
      </p>
    </div>
  );
}
