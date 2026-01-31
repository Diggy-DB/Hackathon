import Player from '../src/components/Player';
import SceneTimeline from '../src/components/SceneTimeline';
import SceneBibleCard from '../src/components/SceneBibleCard';

export default function Page() {
  return (
    <div className="space-y-8">
      <section className="hero">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <h1 className="title font-serif font-semibold">Collaborative cinematic + anime storytelling</h1>
              <p className="lead mt-4">Generate, iterate, and publish collaborative scenes with your team. Fast prototyping, AI-assisted continuity, and a visual-first interface for writers and creators.</p>
              <div className="mt-6 flex gap-3">
                <a className="px-4 py-2 bg-gold text-black rounded font-medium" href="#">Get started</a>
                <a className="px-4 py-2 border rounded text-gray-300" href="#">Learn more</a>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-gradient-to-br from-surface/60 to-transparent rounded-lg p-6">
                <Player />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SceneTimeline />
        </div>
        <aside className="space-y-4">
          <SceneBibleCard />
        </aside>
      </section>
    </div>
  );
}
