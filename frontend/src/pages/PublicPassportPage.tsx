import { Award, CheckCircle2, Leaf, Share2, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { usePublicPassport } from '../hooks/usePublicPassport.ts';

export default function PublicPassportPage() {
  const { shareId = '' } = useParams();
  const passport = usePublicPassport(shareId);

  async function share() {
    const data = passport.data;
    if (!data) return;
    const payload = {
      title: `${data.displayName}'s Kiwimpact Passport`,
      text: `${data.verifiedQuestCount} verified Quests · Level ${data.level} ${data.rankTitle}`,
      url: window.location.href,
    };
    if (navigator.share) await navigator.share(payload);
    else await navigator.clipboard.writeText(window.location.href);
  }

  if (passport.isPending) {
    return <main className="kiwi-page py-10"><div className="skeleton h-80 w-full" /></main>;
  }
  if (passport.isError || !passport.data) {
    return (
      <main className="kiwi-page py-16 text-center">
        <ShieldCheck aria-hidden="true" className="mx-auto size-12 text-muted-content" />
        <h1 className="mt-5 text-3xl">Public Passport not found</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-content">This Passport is private, unavailable, or the link is incorrect.</p>
        <Link className="btn btn-primary mt-6 rounded-full" to="/">Explore Kiwimpact</Link>
      </main>
    );
  }

  const data = passport.data;
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-8 sm:py-12">
      <main className="kiwi-page-wide max-w-[1100px]">
        <section className="kiwi-panel overflow-hidden" aria-labelledby="public-passport-title">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary p-6 text-primary-content sm:p-9">
            <Leaf aria-hidden="true" className="absolute -right-8 -top-8 size-48 rotate-12 opacity-10" />
            <div className="relative flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] opacity-80">Verified Impact Passport</p>
                <h1 className="mt-2 text-4xl sm:text-5xl" id="public-passport-title">{data.displayName}</h1>
                <p className="mt-2 text-lg font-bold">Level {data.level} · {data.rankTitle}</p>
              </div>
              <button className="btn rounded-full border-white/35 bg-white/15 text-white hover:bg-white/25" onClick={() => void share()} type="button">
                <Share2 aria-hidden="true" className="size-4" /> Share Passport
              </button>
            </div>
            <div className="relative mt-8 grid grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-3">
              <div className="rounded-2xl bg-black/15 p-4"><p className="text-2xl font-black">{data.verifiedXp.toLocaleString()}</p><p className="text-xs font-bold uppercase tracking-wider opacity-80">Verified XP</p></div>
              <div className="rounded-2xl bg-black/15 p-4"><p className="text-2xl font-black">{data.verifiedQuestCount}</p><p className="text-xs font-bold uppercase tracking-wider opacity-80">Verified Quests</p></div>
              <div className="col-span-2 rounded-2xl bg-black/15 p-4 sm:col-span-1"><p className="text-2xl font-black">{data.trophy.tier}</p><p className="text-xs font-bold uppercase tracking-wider opacity-80">Achievement Trophy</p></div>
            </div>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="featured-achievements-title">
          <p className="kiwi-stat-label">Chosen by this member</p>
          <h2 className="mt-1 text-2xl" id="featured-achievements-title">Featured achievements</h2>
          {data.featuredAchievements.length === 0 ? (
            <div className="kiwi-panel mt-4 p-6 text-sm text-muted-content">No featured achievements yet.</div>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.featuredAchievements.map((achievement) => (
                <li className="kiwi-panel relative overflow-hidden p-5" key={achievement.achievementId}>
                  <Sparkles aria-hidden="true" className="absolute right-3 top-3 size-8 text-secondary/20" />
                  <span className="grid size-11 place-items-center rounded-2xl bg-secondary/15 text-secondary"><Award className="size-6" /></span>
                  <h3 className="mt-4 text-lg">{achievement.name}</h3>
                  <p className="mt-1 text-sm text-muted-content">{achievement.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{achievement.rarity}</span>
                    <span>{achievement.earnedPercentage.toLocaleString()}% nationwide</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8" aria-labelledby="verified-stories-title">
          <p className="kiwi-stat-label">Actions with completion provenance</p>
          <h2 className="mt-1 text-2xl" id="verified-stories-title">Verified Quest Stories</h2>
          {data.verifiedStories.length === 0 ? (
            <div className="kiwi-panel mt-4 p-6 text-sm text-muted-content">No public verified stories yet.</div>
          ) : (
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {data.verifiedStories.map((story) => (
                <article className="kiwi-panel overflow-hidden" key={story.postId}>
                  {(story.images[0]?.imageUrl || story.questCoverImageUrl) && (
                    <img alt={story.images[0]?.imageAltText ?? ''} className="h-44 w-full object-cover" loading="lazy" src={story.images[0]?.imageUrl ?? story.questCoverImageUrl!} />
                  )}
                  <div className="p-5">
                    <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary"><CheckCircle2 className="size-4" /> Verified Quest Story</p>
                    <h3 className="mt-2 text-xl">{story.title}</h3>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-muted-content">{story.content}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs font-bold">{story.questTitle}</span>
                      <Link className="btn btn-ghost btn-xs" to={`/community/posts/${story.postId}`}>View story →</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-content">
          <Trophy aria-hidden="true" className="size-4" /> Trophy rarity: {data.trophy.rarity} · {data.trophy.earnedPercentage.toLocaleString()}% nationwide
        </footer>
      </main>
    </div>
  );
}
