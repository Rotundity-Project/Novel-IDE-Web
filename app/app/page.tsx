export default function HomePage() {
  return (
    <main className="home">
      <section className="panel">
        <h1>Novel Studio Web</h1>
        <p>Phase 1 deployable framework is ready.</p>
        <ul>
          <li>Frontend: Next.js App Router + TypeScript</li>
          <li>Backend: Fastify + TypeScript</li>
          <li>Data: PostgreSQL + Redis via Docker Compose</li>
        </ul>
      </section>
    </main>
  );
}