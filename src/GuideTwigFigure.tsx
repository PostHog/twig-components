"use client";
import { useEffect, useState } from 'react';
import { CompactTwig, CompactStayFilters } from './Compact.js';
import { StayCardContent } from './StayCard.js';
import { LoginView, ProfileMenu, SavedStaysView } from './Account.js';
import { SavedStay } from './SavedStay.js';
import { InstrumentationInspector } from './InstrumentationInspector.js';
import { stays, type Stay } from './catalog.js';
import type { StaySetting } from './settings.js';
import type { FigureComponent } from './guide-author.js';

/** Local teaching interactions, isolated from both author drafts and the Twig session. */
export function GuideTwigFigure({ caption, components = ['filters', 'stay-card'], inspector = true, previewPhotos, onInteraction }: {
  previewPhotos?: Partial<Record<StaySetting, string>>; caption?: string; components?: FigureComponent[]; inspector?: boolean; onInteraction?: (action: string) => void;
}) {
  const [setting, setSetting] = useState<StaySetting>('Forest');
  const [saved, setSaved] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState(components.includes('profile'));
  const [loginOpen, setLoginOpen] = useState(components.includes('login'));
  const [profileOpen, setProfileOpen] = useState(false);
  const [booking, setBooking] = useState<'ready' | 'pending' | 'done'>('ready');
  const [event, setEvent] = useState<{ name: string; properties: Record<string, string> } | null>(null);
  const stay = stays.find(s => s.setting === setting) ?? stays[0];
  function capture(name: string, properties: Record<string, string>) {
    setEvent({ name, properties }); onInteraction?.('figure_interacted');
  }
  useEffect(() => {
    if (booking !== 'pending') return;
    const timer = setTimeout(() => {
      setBooking('done');
      setEvent({ name: 'booking_completed', properties: { stay_id: stay.id } });
    }, 650);
    return () => clearTimeout(timer);
  }, [booking, stay.id]);
  function reset() {
    setSetting('Forest'); setSaved([]); setSignedIn(components.includes('profile'));
    setLoginOpen(components.includes('login')); setProfileOpen(false); setBooking('ready'); setEvent(null);
  }
  const image = (s: Stay) => <div className="vac-image"><img src={previewPhotos?.[s.setting] ?? s.images?.[0]?.src} alt={s.images?.[0]?.alt ?? s.title} /></div>;
  const showStay = components.includes('stay-card') || components.includes('save') || components.includes('booking');
  return <figure className="ph-guide-figure">
    <div className="ph-author-section-header"><span>Figure</span><button type="button" className="ph-author-quiet" onClick={reset}>Reset</button></div>
    <div className="ph-guide-figure-columns" data-inspector={inspector}>
      <CompactTwig headerActions={components.includes('profile') && signedIn ? <ProfileMenu
        className="twig-compact-profile" profile={{ displayName: 'Edgar Hogg', email: 'edgar.hogg@fakeemail.com' }}
        links={[]} open={profileOpen} onOpenChange={setProfileOpen}
        onSignOut={() => { setSignedIn(false); setProfileOpen(false); setSaved([]); setEvent(null); onInteraction?.('figure_interacted'); }}
      /> : undefined}>
        {components.length === 0 && <p>Choose a Twig component.</p>}
        {loginOpen ? <LoginView email="edgar.hogg@fakeemail.com" onLogin={() => {
          setSignedIn(true); setLoginOpen(false); onInteraction?.('figure_interacted');
        }} /> : <>
          {components.includes('filters') && <CompactStayFilters value={setting} onChange={value => {
            setSetting(value); setBooking('ready'); capture('stay_filter_selected', { destination_type: value });
          }} />}
          {showStay && <article className="twig-compact-stay"><StayCardContent compact stay={stay} image={image(stay)} />
            {components.includes('save') && <div className="twig-compact-save">{signedIn ? <SavedStay stayName={stay.title ?? 'Stay'} signedIn saved={saved.includes(stay.id)} onSavedChange={next => {
              setSaved(current => next ? [...current, stay.id] : current.filter(id => id !== stay.id));
              capture(next ? 'stay_saved' : 'stay_unsaved', { stay_id: stay.id });
            }} /> : <SavedStay stayName={stay.title ?? 'Stay'} signedIn={false} onSignIn={() => setLoginOpen(true)} />}</div>}
          </article>}
          {components.includes('booking') && <div className="twig-compact-booking"><button type="button" className="vac-button vac-primary" disabled={booking !== 'ready'} onClick={() => {
            setBooking('pending'); capture('booking_started', { stay_id: stay.id });
          }}>{booking === 'ready' ? 'Book stay' : booking === 'pending' ? 'Confirming…' : 'Booking confirmed'}</button></div>}
          {components.includes('saved-stays') && <SavedStaysView compact stays={stays.filter(s => saved.includes(s.id))} renderImage={image}
            stayHref={() => '#'} onNavigate={() => {}} />}
          {!signedIn && components.includes('profile') && <button type="button" className="vac-button" onClick={() => setLoginOpen(true)}>Log in</button>}
        </>}
      </CompactTwig>
      {inspector && <section aria-label="Figure event inspector"><h3>Event inspector</h3>
        <p>Example data from this preview.</p>
        {event ? <InstrumentationInspector event={event.name} properties={event.properties} /> : <p>Interact with Twig to inspect an event.</p>}
      </section>}
    </div>
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}
