import { heroFocus } from '../features/tracks/domain/aerosol-paths.js';
import { loadAerosolTrack, loadHeroAods } from '../features/tracks/data/aerosol-track-source.js';
import { heroAt, heroSeries } from '../features/tracks/domain/aerosol-hero.js';
import { createParticleToggles } from '../features/controls/presentation/particle-toggles.js';
'use strict';

// Composition root: wires the features together.

import { albums, WILDFIRE_DAY_TIMELINE, WILDFIRE_YEAR_TIMELINE } from '../features/album/data/albums.js';
import { albumDurationSec, formatDuration, trackBoundaries, trackCover, trackFadeAt, trackIndexAt, trackStartSec, wrapIndex } from '../features/album/domain/album.js';
import { createAlbumColumn } from '../features/album/presentation/album-column.js';
import { createAlbumCredit } from '../features/album/presentation/album-credit.js';
import { createBackdrop } from '../features/album/presentation/backdrop.js';
import { catCheek, createCatView } from '../features/cat/presentation/cat-view.js';
import { PlaybackState } from '../features/controls/domain/playback-state.js';
import { createMediaCenter } from '../features/controls/data/media-center.js';
import { createAlbumSwitcher } from '../features/controls/presentation/album-switcher.js';
import { createFullscreenButton } from '../features/controls/presentation/fullscreen-button.js';
import { createGlassCapsule } from '../features/controls/presentation/glass-capsule.js';
import { createMoreMenu } from '../features/controls/presentation/more-menu.js';
import { createPlayButton } from '../features/controls/presentation/play-button.js';
import { createPlayHint } from '../features/controls/presentation/play-hint.js';
import { createVolumeControl } from '../features/controls/presentation/volume-control.js';
import { ALBUM_NOTES } from '../features/album/data/album-notes.js';
import { createDocentBubble } from '../features/docent/presentation/docent-bubble.js';
import { createDocentToggle } from '../features/docent/presentation/docent-toggle.js';
import { createDocentNarrator } from '../features/docent/presentation/docent-narrator.js';
import { createDocentVoice } from '../features/docent/data/docent-voice.js';
import { introLines, introSec as docentIntroLength, trackLines } from '../features/docent/data/docent-audio.js';
import { GLOBE_THEMES } from '../features/globe/data/globe-themes.js';
import { DEFAULT_GLOBE_LENS } from '../features/globe/domain/globe-lens.js';
import { DEFAULT_GLOBE_THEME } from '../features/globe/domain/globe-theme.js';
import { createDateLabel } from '../features/globe/presentation/date-label.js';
import { createGlobeView } from '../features/globe/presentation/globe-view.js';
import { createHalo } from '../features/globe/presentation/halo.js';
import { createSeaLevelOverlay } from '../features/globe/presentation/sea-level-overlay.js';
import { smogColor } from '../features/globe/presentation/pollution-color.js';
import { createWildfireOverlay } from '../features/globe/presentation/wildfire-overlay.js';
import { ABOUT } from '../features/info/data/about.js';
import { LICENSES } from '../features/info/data/licenses.js';
import { ONBOARDING } from '../features/info/data/onboarding.js';
import { createInfoDialog, renderAbout, renderLicenses } from '../features/info/presentation/info-dialog.js';
import { createOnboarding } from '../features/info/presentation/onboarding.js';
import { createMusicPlayer } from '../features/music/data/music-player.js';
import { createSoundEngine } from '../features/music/data/sound-engine.js';
import { createSpatialPreview } from '../features/music/data/spatial-preview.js';
import { SOUNDFONT_CREDIT } from '../features/music/data/soundfont-bank.js';
import { AerosolComposer, aerosolSong } from '../features/music/domain/composers/aerosol.js';
import { FlockComposer } from '../features/music/domain/composers/flock.js';
import { HurricaneComposer } from '../features/music/domain/composers/hurricane.js';
import { LightningComposer } from '../features/music/domain/composers/lightning.js';
import { SmogComposer } from '../features/music/domain/composers/smog.js';
import { NoonComposer } from '../features/music/domain/composers/noon.js';
import { seasonSong, StormSeasonComposer } from '../features/music/domain/composers/storm-season.js';
import { iceSeaScore } from '../features/music/domain/ice-sea-score.js';
import { annualBurnScore, seasonScore } from '../features/music/domain/wildfire-score.js';
import { loadBirdTracks } from '../features/tracks/data/bird-track-source.js';
import { loadLightningTrack } from '../features/tracks/data/lightning-season-source.js';
import { loadSmogTrack } from '../features/tracks/data/smog-source.js';
import { loadNoonSong } from '../features/tracks/data/noon-line-source.js';
import { loadStormSeason } from '../features/tracks/data/storm-season-source.js';
import { loadStormTrack } from '../features/tracks/data/storm-track-source.js';
import { loadIceSeaTrack, loadWildfireTrack } from '../features/tracks/data/track-repository.js';
import { dailyFlock, sampleFlock } from '../features/tracks/domain/bird-track.js';
import { boxFocus, hourlyAt, smogDurationSec } from '../features/tracks/domain/smog.js';
import { STEP_SEC, levelAt, lineLonAt } from '../features/tracks/domain/noon-line.js';
import { seasonTimeAt } from '../features/tracks/domain/storm-season.js';
import { sampleStorm, stormFadeAt, stormMsPerSec, stormTimeAt } from '../features/tracks/domain/storm-track.js';
import { YEAR_TIMELINE, yearAt } from '../features/tracks/domain/year-timeline.js';
import { createRecordSwap } from '../features/turntable/presentation/record-swap.js';
import { createTurntableView } from '../features/turntable/presentation/turntable-view.js';
import { pointInScreen, rectInScreen } from '../shared/screen-space.js';
import { createAnnouncer } from '../shared/announcer.js';
import { isRovingKey } from '../shared/roving-focus.js';
import { createTicker } from '../shared/ticker.js';

// The contiguous United States, zoomed until the label's edge is 30 degrees of arc from its middle, so the West's fires
// read large.
const CONUS_FOCUS = Object.freeze({ lat: 39, lon: -98, arcDeg: 30 });

// Set by showAlbum().
let albumIndex = 0;
let album;
let totalMs;
// Data of each track of the album, by track index; null until loaded, and for tracks without data.
/** @type {(import('../features/tracks/data/track-repository.js').IceSeaTrackData | null)[]} */
let trackData = [];
let aerosolData = [];
// The track whose particle toggles are set (see renderAerosol); null while none is shown.
let togglesTrack = null;
// Credits added once the album's music is built, such as the SoundFont the ice is played on.
let musicCredits = [];
// The attribution of the globe's map and imagery, shown with the album's credits.
let mapCredit = '';
// What each track of the album plays, by track index, once its data has loaded (see the Song of sound-engine.js): its
// birds (`tracks`, `lead`), its storm (`storm`), its year of lightning (`lightning`) its forest under the noon line
// (`forest`) or the smog around a city (`smog`), or null for a track with none of them. Empty until then.
let songs = [];
// The storm season each track of the album plays, by track index, once loaded (see seasonSong), or null for a track
// without one; empty until then. The season the globe shows.
let seasons = [];
let shownSeason = null;
// The song whose birds, storm, lightning or forest the globe shows, and where they are now (the globe keeps them in the
// middle).
let shownSong = null;
let focus = null;
// The pole the globe looks down on for an ice track, to glide there when it changes; null for other tracks.
let shownPole = null;
// What a wildfire track shows now (album, track and year or day), so the globe changes only when it does; null when
// no wildfire track is shown.
let shownFireKey = null;

let state = PlaybackState.STOPPED;
let elapsedMs = 0;
// Whether the docent is on. While it is, an album opens with the docent's introduction before its first track, its
// words read aloud and shown as captions (docentNarrator): introMs is how far into it the record is, and null once
// past it (or when the docent is off). The album's own clock (elapsedMs) waits at 0 meanwhile, and its music is silent.
let docentOn = false;
let introMs = null;
// Whether the voice has begun this introduction, so playing again after a pause resumes it rather than starting over.
let introVoiced = false;
// The track the docent last announced (album id and track index), so each is announced once as it begins.
let announcedKey = null;
const docentVoice = createDocentVoice();
let lastFrameTs = null;
// True while the records change; steps asked for meanwhile add up in pendingSteps.
let swapping = false;
let pendingSteps = 0;
// True while a hand holds the record that was playing.
let handHeld = false;
// The album and track a screen reader was last told of (see tellScreenReader), null before the first render.
let announcedAlbum = null;
let announcedTrack = null;

const slot = (id) => document.getElementById(id);

const backdrop = createBackdrop(document.documentElement);
const announcer = createAnnouncer(slot('screen'));
const playHint = createPlayHint(slot('bottom-center'));
const albumColumn = createAlbumColumn(slot('stage'), albums, { onSelectTrack: playFromTrack, onSelectDocent: playDocent });
// Boxes and pointers in the layout's own pixels, which a portrait screen turned to show it landscape does not share
// with the client's.
const screenSpace = Object.freeze({
  rectOf: (el) => rectInScreen(slot('screen'), el),
  pointOf: (event) => pointInScreen(slot('screen'), event.clientX, event.clientY),
});
const turntable = createTurntableView(slot('stage'), {
  space: screenSpace,
  onCued: () => {
    if (state === PlaybackState.CUEING) startPlaying();
  },
  onGrab: () => {
    unlockSound();
    setState(PlaybackState.SCRUBBING);
  },
  onScrub: (progress) => {
    if (progress === null) return;
    leaveIntro();
    elapsedMs = progress * totalMs;
    render();
    globe.glide();
  },
  onDrop: (progress) => {
    leaveIntro();
    elapsedMs = progress * totalMs;
    startPlaying();
  },
  onLift: () => setState(PlaybackState.STOPPED),
  onSeek: seekTrack,
  onSelectGroove: (progress) => playFromTrack(trackIndexAt(album, progress)),
  // A hand on the playing record pauses it; turning it moves the music forward or back as far as it is turned, and
  // letting go plays on from there.
  onHandHold: () => {
    if (state !== PlaybackState.PLAYING) return;
    handHeld = true;
    setState(PlaybackState.HELD);
  },
  onHandTurn: (sec) => {
    if (!handHeld || state !== PlaybackState.HELD) return;
    leaveIntro();
    elapsedMs = Math.min(totalMs - 1, Math.max(0, elapsedMs + sec * 1000));
    render();
    globe.glide();
  },
  onHandRelease: () => {
    if (!handHeld) return;
    handHeld = false;
    if (state === PlaybackState.HELD) startPlaying();
  },
});
// The album's credits run round the record's rim.
const albumCredit = createAlbumCredit((text) => turntable.setCredit(text));
const particleToggles = createParticleToggles(turntable.label, (toggles) => {
  globe.aerosol.setToggles(toggles);
});

const recordSwap = createRecordSwap({
  recordEl: turntable.recordEl,
  recordGeometry: turntable.recordGeometry,
  rectOf: screenSpace.rectOf,
  column: albumColumn,
});
const globe = createGlobeView(turntable.labelSlot);
const seaOverlay = createSeaLevelOverlay(turntable.labelSlot);
const wildfireOverlay = createWildfireOverlay(turntable.labelSlot);
const music = createMusicPlayer();
globe.setFocus(() => focus);
const dateLabel = createDateLabel(turntable.labelSlot);
const halo = createHalo(turntable.haloCanvas, () => soundEngine.analyser);
new ResizeObserver(() => halo.place(turntable.labelDisc())).observe(turntable.haloCanvas);
const soundEngine = createSoundEngine();
const flockComposer = new FlockComposer();
const hurricaneComposer = new HurricaneComposer();
const lightningComposer = new LightningComposer();
const smogComposer = new SmogComposer();
const aerosolComposer = new AerosolComposer();
const ticker = createTicker(tick);
// The system's media controls play and pause, and step through the tracks, on into the next or previous album.
const mediaCenter = createMediaCenter({
  onPlay: () => {
    if (state === PlaybackState.STOPPED) togglePlayback();
  },
  onPause: () => {
    if (state === PlaybackState.PLAYING || state === PlaybackState.CUEING) togglePlayback();
  },
  onPrevious: () => stepTrack(-1),
  onNext: () => stepTrack(1),
});
const noonComposer = new NoonComposer();
// The globe turns to keep the noon meridian in front, easing with this time constant; while playing, it aims this far
// ahead of the line, so the eased camera settles on the line itself rather than trailing it.
const FOREST_FOLLOW_TAU_SEC = 0.5;

const transportControls = createGlassCapsule(slot('corner-bottom-left'), { label: 'Playback' });
const playButton = createPlayButton(transportControls, { onToggle: togglePlayback });
const volumeControl = createVolumeControl(transportControls, {
  onChange: (level) => {
    music.setVolume(level);
    soundEngine.setVolume(level);
    docentVoice.setVolume(level);
  },
});
const albumControls = createGlassCapsule(slot('corner-bottom-left'), { label: 'Album' });
const albumSwitcher = createAlbumSwitcher(albumControls, {
  onPrevious: () => switchAlbum(-1),
  onNext: () => switchAlbum(1),
});
// Whether the docent is on when the page opens.
const DOCENT_ON_AT_START = true;
// The docent, on from the start (DOCENT_ON_AT_START) until turned off: the cat says the current album's introduction (see showAlbum).
// The bubble keeps clear of the globe on the record's label, and points at the cat.
const docentBubble = createDocentBubble(slot('screen'), {
  avoid: () => {
    const rect = screenSpace.rectOf(turntable.label);
    return rect.width ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, r: rect.width / 2 } : null;
  },
  speaker: () => catCheek(screenSpace.rectOf),
});
const docentNarrator = createDocentNarrator(docentVoice, docentBubble);
const docentToggle = createDocentToggle(createGlassCapsule(slot('corner-bottom-left'), { label: 'Docent' }), {
  on: DOCENT_ON_AT_START,
  onChange: setDocent,
});
const viewControls = createGlassCapsule(slot('corner-top-right'), { label: 'View' });
createFullscreenButton(viewControls);
const aboutDialog = createInfoDialog(slot('screen'), {
  id: 'about',
  title: 'Blue Vinyl',
  subtitle: ABOUT.tagline,
  body: renderAbout(ABOUT, albums.map((album) => ({
      title: album.title,
      duration: formatDuration(albumDurationSec(album)),
    })),
    (index) => {
      aboutDialog.close();
      goToAlbum(index);
    }),
});
const licenseDialog = createInfoDialog(slot('screen'), {
  id: 'license',
  title: 'Licenses',
  subtitle: 'Software, sound, photos and data',
  body: renderLicenses(LICENSES),
});
createMoreMenu(viewControls, {
  items: [
    { label: 'About', onSelect: () => aboutDialog.open() },
    { label: 'License', onSelect: () => licenseDialog.open() },
  ],
});
applyGlobeTheme(DEFAULT_GLOBE_THEME);
createCatView(slot('screen'));
// A drag is no gesture audio may start from on a phone, so the onboarding's taps unlock the sound first.
// The bars and the safe areas take the onboarding's color while it is up.
backdrop.overlay(getComputedStyle(document.documentElement).getPropertyValue('--title-bg').trim());
document.documentElement.classList.add('is-booted');
const onboarding = createOnboarding(slot('screen'), {
  content: ONBOARDING,
  stage: slot('stage'),
  preview: createSpatialPreview(),
  onStart: () => {
    backdrop.overlay(null);
    unlockSound();
  },
});

// Album switch keys, as the previous and next chevrons.
const ALBUM_KEYS = Object.freeze({ ArrowLeft: -1, ArrowRight: 1 });
// Volume keys: up louder, down quieter.
const VOLUME_KEYS = Object.freeze({ ArrowUp: 1, ArrowDown: -1 });
// The number keys, on the main row or the keypad, go straight to the album at that place in the catalog (1 the first).
const ALBUM_NUMBER_CODE = /^(?:Digit|Numpad)([1-9])$/;
// The docent key, by its place on the keyboard (so it works whatever the layout's letter there, Korean too).
const DOCENT_KEY = 'KeyD';

// Space always plays or pauses, left and right switch albums, 1 to 9 go to an album and up and down set the volume,
// wherever the focus is.
// Captured before any control sees the key, so a button left focused by a click is not pressed again.
document.addEventListener(
  'keydown',
  (event) => {
    // The onboarding keeps its keys while it is up: Space and Enter press its buttons, the arrows step through it.
    if (event.altKey || event.ctrlKey || event.metaKey || onboarding.isOpen()) return;
    // An open dialog or menu keeps its keys: Space and the arrows scroll the dialog or move through the menu.
    if (document.querySelector('dialog[open]')) return;
    if (event.target instanceof Element && event.target.closest('[role="menu"]')) return;
    if (event.code === 'Space') {
      event.preventDefault();
      releaseClickFocus();
      if (!event.repeat) togglePlayback();
      return;
    }
    // D turns the docent on and off, as its button does; a text field keeps its letters.
    if (event.code === DOCENT_KEY && !(event.target instanceof HTMLInputElement && event.target.type !== 'range')) {
      event.preventDefault();
      releaseClickFocus();
      if (!event.repeat) docentToggle.toggle();
      return;
    }
    const albumNumber = ALBUM_NUMBER_CODE.exec(event.code);
    // A text field keeps its digits.
    if (albumNumber && !(event.target instanceof HTMLInputElement && event.target.type !== 'range')) {
      event.preventDefault();
      releaseClickFocus();
      if (!event.repeat) goToAlbum(Number(albumNumber[1]) - 1);
      return;
    }
    const albumStep = ALBUM_KEYS[event.key];
    const volumeStep = VOLUME_KEYS[event.key];
    if (!albumStep && !volumeStep) return;
    // A toolbar or the track list reached from the keyboard keeps the arrows that move between its items.
    if (event.target !== clickFocused && isRovingKey(event.target, event.key)) return;
    // The volume slider and the progress ring keep their arrows while used from the keyboard.
    const slider = event.target instanceof HTMLInputElement || (event.target instanceof Element && event.target.closest('[role="slider"]'));
    if (slider && event.target !== clickFocused) return;
    event.preventDefault();
    releaseClickFocus();
    // Holding an up or down key keeps turning the volume; holding left or right switches albums once.
    if (volumeStep) volumeControl.step(volumeStep);
    else if (!event.repeat) switchAlbum(albumStep);
  },
  { capture: true },
);
// The control a click focused, which shows no focus ring until a key is pressed. Focus reached from the keyboard
// shows its ring at once and is not kept here.
let clickFocused = null;
document.addEventListener('focusin', (event) => {
  clickFocused = event.target instanceof HTMLElement && !event.target.matches(':focus-visible') ? event.target : null;
});

/** Lets go of the focus a click left on a control, before the key would light up its focus ring. */
function releaseClickFocus() {
  if (clickFocused && clickFocused === document.activeElement) clickFocused.blur();
  clickFocused = null;
}

// Safari ignores touch-action for pinches, so a pinch on the turntable (the record, the arm, the globe), which takes its
// own touches, would zoom the page too; there it is cancelled. Anywhere else a pinch zooms the page.
document.addEventListener('gesturestart', (event) => {
  if (event.target instanceof Element && event.target.closest('.turntable')) event.preventDefault();
});

// A focused button is pressed on Space's keyup, so that is held back too.
document.addEventListener(
  'keyup',
  (event) => {
    if (event.code === 'Space' && !onboarding.isOpen()) event.preventDefault();
  },
  { capture: true },
);

function applyGlobeTheme(theme) {
  globe.setTheme(theme, GLOBE_THEMES[theme]);
  mapCredit = GLOBE_THEMES[theme].attribution;
  if (album) render();
}

function showAlbum(index) {
  albumIndex = index;
  album = albums[albumIndex];
  totalMs = albumDurationSec(album) * 1000;
  albumColumn.setAlbum(albumIndex);
  albumSwitcher.render(albums[wrapIndex(index - 1, albums.length)].title, albums[wrapIndex(index + 1, albums.length)].title);
  // A new album opens with the docent's introduction while the docent is on.
  if (docentOn) enterIntro();
  else leaveIntro();
  globe.setLens(album.globeLens ?? DEFAULT_GLOBE_LENS);
  turntable.setTrackStarts(trackBoundaries(album).slice(1, -1));
  songs = [];
  showSong(null, null);
  loadSongs(album);
  seasons = [];
  showSeason(null, null);
  loadSeasons(album);
  trackData = album.tracks.map(() => null);
  musicCredits = [];
  music.load([]);
  loadAlbumData(album);
  aerosolData = album.tracks.map(() => null);
  loadAerosolData(album);
}

/**
 * Loads score-driven track data (ice/sea or wildfire), then builds the album's music: each track's notes, moved to
 * where the track starts. Playback that is already running picks the music up where it is.
 *
 * @param {import('../features/album/domain/album.js').Album} loading
 */
async function loadAlbumData(loading) {
  const hasIce = loading.tracks.some((track) => track.iceSea);
  const hasFire = loading.tracks.some((track) => track.wildfire);
  if (!hasIce && !hasFire) return;
  let data;
  try {
    data = await Promise.all(
      loading.tracks.map((track) => {
        if (track.iceSea) return loadIceSeaTrack(track.iceSea);
        if (track.wildfire) return loadWildfireTrack(track.wildfire);
        return null;
      }),
    );
  } catch (error) {
    console.warn('Album data unavailable:', error);
    return;
  }
  if (album !== loading) return;
  trackData = data;
  // Only ice tracks have ice to prepare; wildfire tracks have data but no ice.
  data.forEach((track, i) => {
    const { iceSea } = album.tracks[i];
    if (track && iceSea) globe.prepareIce({ key: iceKey(album, i), poleLat: iceSea.poleLat, shapes: track.iceShapes });
  });
  const starts = trackBoundaries(album).map((edge) => (edge * totalMs) / 1000);
  const notes = album.tracks.flatMap((track, i) => {
    if (!data[i]) return [];
    const offset = starts[i];
    if (track.iceSea) {
      return iceSeaScore(data[i].years, track.iceSea.iceVoice, YEAR_TIMELINE, track.durationSec).map((note) => ({
        ...note,
        timeSec: note.timeSec + offset,
      }));
    }
    if (track.wildfire?.kind === 'annual') {
      return annualBurnScore(data[i].years, data[i].firesByYear, WILDFIRE_YEAR_TIMELINE, track.durationSec).map((note) => ({
        ...note,
        timeSec: note.timeSec + offset,
      }));
    }
    if (track.wildfire?.kind === 'season') {
      return seasonScore(data[i].days, WILDFIRE_DAY_TIMELINE, track.durationSec).map((note) => ({
        ...note,
        timeSec: note.timeSec + offset,
      }));
    }
    return [];
  });
  music.load(notes);
  musicCredits = [SOUNDFONT_CREDIT];
  if (state === PlaybackState.PLAYING) playMusic();
  render();
  globe.glide();
}

// Loads the birds, the storm, the lightning or the forest of each of `target`'s tracks, unless another album is shown
// by then.
async function loadSongs(target) {
  if (!target.tracks.some((track) => track.birdsUrl || track.storm || track.lightning || track.forest || track.smog)) return;
  let perTrack;
  try {
    perTrack = await Promise.all(target.tracks.map((track) => loadSong(track, target)));
  } catch (error) {
    console.warn('Album data unavailable:', error);
    return;
  }
  if (album !== target) return;
  songs = withFastestWind(perTrack);
  render();
  globe.glide();
}

// Gives each storm song the album's strongest wind, which its tempo is in proportion to (tempoOf).
function withFastestWind(perTrack) {
  const winds = perTrack.filter((song) => song?.storm).flatMap((song) => song.track.windKt);
  if (!winds.length) return perTrack;
  const fastestKt = Math.max(...winds);
  return perTrack.map((song) => (song?.storm ? { ...song, fastestKt } : song));
}

/**
 * @param {import('../features/album/domain/album.js').Track} track
 * @param {import('../features/album/domain/album.js').Album} target the album it is on
 * @returns {Promise<import('../features/music/data/sound-engine.js').Song | null>}
 */
async function loadSong(track, target) {
  if (track.birdsUrl) {
    const tracks = await loadBirdTracks(track.birdsUrl);
    return {
      tracks,
      lead: track.lead,
      composer: flockComposer,
      startMs: 0,
      msPerSec: target.msPerSec,
      sampleAt: (time) => sampleFlock(tracks, time),
      path: dailyFlock(tracks),
    };
  }
  if (track.storm) {
    const stormTrack = await loadStormTrack(track.storm);
    return {
      storm: true,
      track: stormTrack,
      kit: track.storm.kit,
      composer: hurricaneComposer,
      startMs: stormTrack.t[0],
      msPerSec: stormMsPerSec(stormTrack, track.durationSec),
      sampleAt: (time) => sampleStorm(stormTrack, time),
      path: stormTrack.t.map((_, i) => ({ lat: stormTrack.lat[i], lon: stormTrack.lon[i] })),
    };
  }
  if (track.lightning) {
    const { season, view } = await loadLightningTrack(track.lightning);
    return {
      lightning: true,
      season,
      view,
      north: track.lightning.north,
      south: track.lightning.south,
      composer: lightningComposer,
      startMs: season.t[0],
      msPerSec: target.msPerSec,
      // The whole year plays; the composer reads the season at each step's time.
      sampleAt: () => season,
    };
  }
  if (track.smog) {
    const { track: smogTrack, city, timeZone } = await loadSmogTrack(track.smog);
    if (smogDurationSec(smogTrack) !== track.durationSec) {
      throw new Error(`${track.smog.file} plays ${smogDurationSec(smogTrack)} s, not ${track.durationSec} s`);
    }
    return {
      smog: true,
      track: smogTrack,
      city,
      // The local clock by the hour.
      dateFormat: { month: 'short', day: '2-digit', hour: '2-digit', hourCycle: 'h23', timeZone },
      focus: boxFocus(smogTrack),
      loop: track.smog.loop,
      composer: smogComposer,
      // Timed in playback ms from the song's start; the composer reads the box at each step's time.
      startMs: 0,
      msPerSec: target.msPerSec,
      sampleAt: () => smogTrack,
    };
  }
  if (track.forest) {
    const forest = await loadNoonSong(track.forest);
    return {
      forest: true,
      ...forest,
      // The album's first track opens with the listening legend.
      legend: target.tracks.indexOf(track) === 0,
      composer: noonComposer,
      // Data time is the track's own time: the composer reads the step of the noon line from it.
      startMs: 0,
      msPerSec: 1000,
      sampleAt: () => forest.line,
      levelAt: (ms) => levelAt(ms / 1000),
      followTauSec: FOREST_FOLLOW_TAU_SEC,
    };
  }
  return null;
}

// Loads the storms of `target`'s season tracks, unless another album is shown by then. Each track's storms sing on
// a composer of their own, set to the track's lead and hemisphere.
async function loadSeasons(target) {
  if (!target.tracks.some((track) => track.season)) return;
  const perTrack = await Promise.all(target.tracks.map((track) => (track.season ? loadStormSeason(track.season.url) : null)));
  if (album !== target) return;
  seasons = perTrack.map((tracks, i) => {
    if (!tracks) return null;
    const { season, durationSec } = target.tracks[i];
    const composer = new StormSeasonComposer(season.lead, season.hemisphere);
    return seasonSong(composer, tracks, season.span, durationSec, season.focus);
  });
  render();
  globe.glide();
}

// Shows `song`'s season on the globe, the glow in `color`; null takes the storms off.
function showSeason(song, color) {
  shownSeason = song;
  globe.storms.reset(color);
  if (!song) return;
  focus = song.focus;
  halo.setColor(color);
  globe.glide();
}

// Puts `song`'s birds on the globe in `color`, and the glow in it; null takes them off. A storm's song clears the
// birds and draws its storm instead (renderStorm); a forest's draws its canopy and noon line (renderForest).
function showSong(song, color) {
  shownSong = song;
  focus = null;
  // A smog track looks at its city from close up.
  globe.setCloseUp(Boolean(song?.smog));
  globe.birds.reset(color);
  globe.forest.reset(song?.forest ? song : null, color);
  globe.storm.show(null);
  halo.setSwirl(song?.storm ? () => globe.storm.swirl : null);
  dateLabel.show(null);
  if (color) halo.setColor(color);
}

// Audio may only start from a user gesture, so every gesture that can start playback unlocks it.
function unlockSound() {
  mediaCenter.unlock();
  music.unlock();
  soundEngine.unlock().catch((error) => console.error('sound engine failed to load', error));
}
document.addEventListener('pointerdown', unlockSound, { once: true });

// Takes one of the steps asked for meanwhile, if any; 0 when none.
function takePendingStep() {
  const step = Math.sign(pendingSteps);
  pendingSteps -= step;
  return step;
}

// True while the listener means the music to play: playing, the arm moving onto the record, or a hand holding it.
function isPlaying() {
  return state === PlaybackState.PLAYING || state === PlaybackState.CUEING || state === PlaybackState.HELD;
}

/**
 * Changes records, once for `step` (-1 or 1) and once more for each step asked for meanwhile, even while the new
 * record is being drawn out (see createRecordSwap): the arm lifts, the record goes into its sleeve and the column of
 * sleeves moves along to the new album, whose record comes out at its start. The catalog wraps around.
 * Given a `target` album, the first change goes straight to it, its sleeve standing next to the current one.
 * With `resume`, by default when the music was playing, the arm sets down on the new record to play it; otherwise
 * it stays off.
 *
 * @param {number} step
 * @param {number | null} [target]
 * @param {boolean} [resume]
 */
async function switchAlbum(step, target = null, resume = isPlaying()) {
  if (swapping) {
    if (recordSwap.skip()) pendingSteps += step;
    return;
  }
  swapping = true;
  // A track list reached from the keyboard gets the focus back on the new sleeve, as the inert stage drops it.
  const focusedTracks = document.activeElement !== clickFocused && document.activeElement?.closest('.album-cover-tracks');
  // Nothing on the stage can be touched while the records change.
  slot('stage').inert = true;
  elapsedMs = 0;
  setState(PlaybackState.STOPPED);
  if (target !== null) albumColumn.setNeighbour(step, target);
  try {
    await recordSwap.play(step, (direction) => {
      showAlbum(target ?? wrapIndex(albumIndex + direction, albums.length));
      target = null;
      render();
    }, takePendingStep);
  } finally {
    pendingSteps = 0;
    slot('stage').inert = false;
    swapping = false;
  }
  if (focusedTracks) albumColumn.focusTracks();
  if (resume) cue();
}

/**
 * Changes records straight to the album at `index`, in one change as switchAlbum does: its sleeve comes from below a
 * later album, from above an earlier one. Nothing happens for the album already shown, an album the catalog does not
 * have, or while the records change.
 */
function goToAlbum(index) {
  if (swapping || index === albumIndex || index >= albums.length) return;
  switchAlbum(Math.sign(index - albumIndex), index);
}

/**
 * Plays the track `step` (-1 or 1) away from the current one. Past either end of the album it plays on into the album
 * next to it (see playNextAlbum).
 */
async function stepTrack(step) {
  if (swapping) return;
  const next = trackIndexAt(album, elapsedMs / totalMs) + step;
  if (next >= 0 && next < album.tracks.length) {
    playFromTrack(next);
    return;
  }
  await playNextAlbum(step);
}

/**
 * Switches to the album `step` (-1 or 1) away, as switchAlbum does, and moves to its first track going forward or its
 * last going back, playing it if the music was playing. A hidden page draws no frames for the records to change by,
 * so there the album changes at once.
 */
async function playNextAlbum(step) {
  const resume = isPlaying();
  if (document.hidden) {
    elapsedMs = 0;
    setState(PlaybackState.STOPPED);
    showAlbum(wrapIndex(albumIndex + step, albums.length));
  } else {
    await switchAlbum(step, null, false);
  }
  if (swapping) return;
  // Going forward, the album opens with the docent's introduction while the docent is on.
  if (step > 0 && docentOn) playDocent();
  else playFromTrack(step > 0 ? 0 : album.tracks.length - 1);
  if (resume) cue();
}

// 0..1 through the track at `trackIndex`.
function trackProgressAt(trackIndex) {
  return (elapsedMs / 1000 - trackStartSec(album, trackIndex)) / album.tracks[trackIndex].durationSec;
}

// Moves to `trackProgress` (0..1) through the current track: playing, the music plays on from there; stopped, it
// stays stopped there.
function seekTrack(trackProgress) {
  if (swapping) return;
  const trackIndex = trackIndexAt(album, elapsedMs / totalMs);
  seekTo((trackStartSec(album, trackIndex) + trackProgress * album.tracks[trackIndex].durationSec) * 1000);
}

// Moves to the start of the track at `trackIndex`, as seekTrack does.
function playFromTrack(trackIndex) {
  if (swapping) return;
  seekTo(trackStartSec(album, trackIndex) * 1000);
}

// Moves the clock to `ms`, keeping the music playing or stopped as it was.
function seekTo(ms) {
  leaveIntro();
  elapsedMs = ms;
  globe.glide();
  // The ice and sea music sets the clock while it plays, so it starts again from the new place.
  if (state === PlaybackState.PLAYING) playMusic();
  render();
}

// Moves to the start of the docent's introduction, before the album's first track, as playFromTrack does: playing, the
// docent speaks from there; stopped, it stays stopped there.
function playDocent() {
  if (swapping) return;
  elapsedMs = 0;
  enterIntro();
  globe.glide();
  if (state === PlaybackState.PLAYING) {
    music.stop();
    soundEngine.stop();
    syncVoice();
  }
  render();
}

/**
 * Turns the docent on or off. Turned on with the record at the album's start, the introduction is played first;
 * turned off during it, the album goes on from its first track at once.
 *
 * @param {boolean} on
 */
function setDocent(on) {
  docentOn = on;
  docentBubble.setOn(on);
  albumColumn.setDocent(on);
  if (on && introMs === null && elapsedMs === 0 && state === PlaybackState.STOPPED) enterIntro();
  if (!on && introMs !== null) {
    leaveIntro();
    if (state === PlaybackState.PLAYING) playMusic();
  }
  // Turned on, it announces the track playing; turned off, it falls silent at once.
  announcedKey = null;
  if (!on) docentNarrator.cancel();
  render();
}

// The record is set at the start of the docent's introduction, its words not yet said.
function enterIntro() {
  docentNarrator.cancel();
  introMs = 0;
  introVoiced = false;
  announcedKey = null;
}

// The record leaves the docent's introduction, its words cut off.
function leaveIntro() {
  if (introMs !== null) docentNarrator.cancel();
  introMs = null;
}

// The docent's introduction is over: the album plays on from its first track.
function finishIntro() {
  if (introMs === null) return;
  leaveIntro();
  playMusic();
  render();
}

// The voice says the introduction while it plays, from where it was held, and holds while it does not.
function syncVoice() {
  if (introMs === null) return;
  if (state !== PlaybackState.PLAYING) {
    docentNarrator.pause();
    return;
  }
  if (introVoiced) {
    docentNarrator.resume();
    return;
  }
  introVoiced = true;
  docentNarrator.speak(introLines(album.id, album.title, ALBUM_NOTES[album.id]?.docentTip), () => {
    if (state === PlaybackState.PLAYING) finishIntro();
  });
}

// While the docent is on, it says each track's number and title as the track begins to play (for a listener who
// cannot see the sleeve), and the bubble shows it.
function announceTrack(trackIndex) {
  if (!docentOn || !sounding()) return;
  const key = `${album.id}:${trackIndex}`;
  if (key === announcedKey) return;
  announcedKey = key;
  const { title } = album.tracks[trackIndex];
  docentNarrator.speak(trackLines(album.id, trackIndex, title));
}

// Plays the album's music from the clock, unless the docent's introduction is playing before it.
function playMusic() {
  if (introMs !== null) return;
  music.play(() => elapsedMs / 1000);
}

// Whether the album's music sounds now: playing, and past the docent's introduction.
function sounding() {
  return state === PlaybackState.PLAYING && introMs === null;
}

function togglePlayback() {
  if (swapping) return;
  unlockSound();
  if (state === PlaybackState.STOPPED) cue();
  else setState(PlaybackState.STOPPED);
}

// A page hidden while the tonearm moves would wait for it until shown again, so it plays at once.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === PlaybackState.CUEING) startPlaying();
});

// Sets the tonearm down to play. A hidden page draws no frames, so the arm cannot move there: it plays at once.
function cue() {
  if (document.hidden) startPlaying();
  else setState(PlaybackState.CUEING);
}

function startPlaying() {
  setState(PlaybackState.PLAYING);
  playMusic();
  lastFrameTs = null;
  ticker.start();
}

function render() {
  const progress = elapsedMs / totalMs;
  const trackIndex = trackIndexAt(album, progress);
  // Every track's music fades in at its start and out at its end.
  const fade = trackFadeAt(album, trackIndex, elapsedMs / 1000 - trackStartSec(album, trackIndex));
  music.setTrackFade(fade);
  soundEngine.setTrackFade(fade);
  turntable.render(state, progress, trackProgressAt(trackIndex), album.tracks[trackIndex]);
  albumColumn.render(trackIndex, introMs !== null);
  announceTrack(trackIndex);
  tellScreenReader(trackIndex);
  globe.describe(`Globe showing ${album.globeAlt}. Track: ${album.tracks[trackIndex].title}.`);
  albumCredit.render(album, trackIndex, [...musicCredits, mapCredit]);
  backdrop.show(trackCover(album, trackIndex).url);
  mediaCenter.setTrack({
    key: `${album.id}:${trackIndex}`,
    title: album.tracks[trackIndex].title,
    album: album.title,
    artworkUrl: trackCover(album, trackIndex).url,
  });
  renderSong(trackIndex);
  renderData(trackIndex);
  renderAerosol(trackIndex);
  renderSeason(trackIndex);
}

// Draws the season at the clock on the globe, held over its ocean, with the date; while playing, the music follows it.
function renderSeason(trackIndex) {
  const song = seasons[trackIndex] ?? null;
  if (shownSeason !== song) showSeason(song, album.tracks[trackIndex].color);
  if (!song) return;
  const trackSec = elapsedMs / 1000 - trackStartSec(album, trackIndex);
  const time = seasonTimeAt(song.span, song.durationSec, trackSec);
  globe.storms.render(song.tracks, time);
  dateLabel.show(time);
  if (!sounding()) return;
  soundEngine.follow(song, trackSec);
  halo.wake();
}

// Names a track's ice on the globe.
function iceKey(shown, trackIndex) {
  return `${shown.id}:${trackIndex}`;
}

/**
 * Draws the year that plays at the clock on the globe, looking down on the track's pole: its ice and the sea level;
 * ice lost from one year to the next falls into the water. The record at rest before it plays shows the first year.
 * Wildfire tracks look at CONUS and show acres / active fires instead.
 */
function renderData(trackIndex) {
  const track = album.tracks[trackIndex];
  const data = trackData[trackIndex];
  if (track.wildfire && data) {
    renderWildfire(data, trackIndex);
    return;
  }
  if (shownFireKey !== null) {
    shownFireKey = null;
    wildfireOverlay.render(null);
    globe.showFires(null);
    dateLabel.show(null);
  }
  if (!track.iceSea || !data) {
    shownPole = null;
    globe.showIce(null);
    seaOverlay.render(null);
    return;
  }
  // Exactly over the pole the camera's orientation is undefined, so look from just short of it.
  focus = { lat: Math.max(-89, Math.min(89, track.iceSea.poleLat)), lon: 0 };
  if (shownPole !== track.iceSea.poleLat) {
    shownPole = track.iceSea.poleLat;
    globe.glide();
  }
  const trackSec = elapsedMs / 1000 - trackStartSec(album, trackIndex);
  const { years } = data;
  const now = yearAt(YEAR_TIMELINE, trackSec, years.length);
  const at = Math.max(0, now.index);
  const trackKey = iceKey(album, trackIndex);
  const year = years[at];
  // Share of this year's bar played: the ice moves from last year's shape to this year's over the bar, starting on
  // the chord and settling into the shape. The water rises from last year's level to this year's over the bar too,
  // from the downbeat, where the sea's string note and wave stroke sound.
  const along = now.index < 0 ? 0 : Math.min(1, now.beatSec / YEAR_TIMELINE.beatSec);
  const settle = 1 - (1 - along) ** 3;
  const rising = along;
  const before = years[Math.max(0, at - 1)];
  const waterMm = before.seaLevelMm + (year.seaLevelMm - before.seaLevelMm) * (1 - (1 - rising) ** 2);
  globe.setWaterLine(seaOverlay.waterLine(waterMm));
  globe.showIce({
    key: trackKey,
    poleLat: track.iceSea.poleLat,
    shapes: data.iceShapes,
    at: at === 0 ? 0 : at - 1 + settle,
    year: at,
    // The lost ice falls for as long as the year's chord is held.
    fallSec: YEAR_TIMELINE.beatSec,
  });
  seaOverlay.render({
    year: year.year,
    waterMm,
  });
}

/**
 * Draws the year or day of a wildfire track that plays at the clock, looking at the contiguous United States: the
 * year's large MTBS fires where they burned, lit through its bar in the order they started (Burned Acres), or each
 * large fire's scar, front and smoke that day (2020 Fire Season). The globe and the read-out change only when the year or day does; the fires ease and flicker by themselves.
 *
 * @param {import('../features/tracks/data/track-repository.js').WildfireTrackData} data
 * @param {number} trackIndex
 */
function renderWildfire(data, trackIndex) {
  const trackSec = elapsedMs / 1000 - trackStartSec(album, trackIndex);
  const timeline = data.kind === 'annual' ? WILDFIRE_YEAR_TIMELINE : WILDFIRE_DAY_TIMELINE;
  const count = data.kind === 'annual' ? data.years.length : data.days.length;
  const at = Math.max(0, yearAt(timeline, trackSec, count).index);
  const key = `${album.id}:${trackIndex}:${at}`;
  focus = CONUS_FOCUS;
  if (key === shownFireKey) return;
  if (shownFireKey === null) {
    shownPole = null;
    globe.showIce(null);
    seaOverlay.render(null);
    globe.glide();
  }
  shownFireKey = key;

  if (data.kind === 'annual') {
    const year = data.years[at];
    const fires = data.firesByYear[at];
    globe.showFires({ mode: 'annual', year: year.year, fires, spanSec: WILDFIRE_YEAR_TIMELINE.beatSec });
    // The acres are NIFC's, all of the year's fires; the globe shows the large ones MTBS maps, none before 1984.
    const acresM = (year.acres / 1e6).toFixed(1);
    const mapped = fires.length ? ` · ${fires.length} large fires mapped` : ' · no fire map before 1984';
    wildfireOverlay.render({
      title: String(year.year),
      detail: `${acresM} M acres${year.isTop10 ? ', among the 10 largest' : ' burned'}${mapped}`,
    });
    dateLabel.show(null);
    return;
  }

  const day = data.days[at];
  globe.showFires({ mode: 'season', day: at, fires: data.fires });
  // The date itself is on the date label.
  wildfireOverlay.render({
    detail: `${Math.round(day.areaKm2).toLocaleString('en')} km² active · ${day.nFires} large fires`,
  });
  dateLabel.show(Date.parse(`${day.day}T12:00:00Z`));
}

async function loadAerosolData(loading) {
  if (!loading.tracks.some((track) => track.aerosol)) return;
  let data;
  try {
    data = await Promise.all(loading.tracks.map((track) => (track.aerosol ? loadAerosolTrack(track.aerosol) : null)));
  } catch (error) {
    console.warn('Aerosol data unavailable:', error);
    return;
  }
  if (album !== loading) return;
  aerosolData = data;
  musicCredits = ['Data: NASA GMAO GEOS-FP · NOAA NHC'];
  render();
  globe.glide();
  // The music takes a while to decode from the frames; the globe does not wait for it.
  const aerosolSongs = await loadAerosolSongs(loading, data);
  if (album !== loading) return;
  songs = aerosolSongs;
}

// The song of each of `target`'s aerosol tracks: its lead particle's way and the air it goes through, which the
// particle toggles switch particle type by particle type.
async function loadAerosolSongs(target, data) {
  const loaded = data.filter(Boolean);
  let aods;
  try {
    aods = await loadHeroAods(loaded);
  } catch (error) {
    console.warn('Aerosol music unavailable:', error);
    return [];
  }
  return data.map((track, i) => {
    if (!track) return null;
    const hero = heroSeries(track.paths, aods[loaded.indexOf(track)]);
    return aerosolSong(aerosolComposer, hero, target.tracks[i].durationSec, target.tracks[i].aerosol.sound, heroAt, () => particleToggles.states);
  });
}

function renderAerosol(trackIndex) {
  const track = album.tracks[trackIndex];
  const data = aerosolData[trackIndex];
  if (album?.id !== 'aerosol' || !track?.aerosol || !data) {
    globe.aerosol.hide();
    globe.aerosolPaths.hide();
    particleToggles.hide();
    togglesTrack = null;
    return;
  }
  particleToggles.show();
  // Each track starts with every particle type on.
  if (togglesTrack !== trackIndex) {
    togglesTrack = trackIndex;
    particleToggles.reset();
  }
  const trackSec = Math.max(0, elapsedMs / 1000 - trackStartSec(album, trackIndex));
  globe.aerosol.render(data.frames, trackSec, track.durationSec);
  const step = Math.min(1, trackSec / track.durationSec) * (data.records.length - 1);
  globe.aerosolPaths.render(data.paths, step);

  // The camera follows the track's lead particle(s), zoomed in on them; until one is released it rests on the track's
  // own view or where Erin's eye starts.
  const view = track.aerosol.viewLat !== undefined
    ? { lat: track.aerosol.viewLat, lon: track.aerosol.viewLon }
    : { lat: data.records[0].viewLat, lon: data.records[0].viewLon };
  focus = heroFocus(data.paths, step) ?? view;

  if (track.color) halo.setColor(track.color);
  if (state === PlaybackState.PLAYING) halo.wake();
}

// Draws the birds, the date and the flock's place at the clock and, while playing, lets the music follow it.
function renderSong(trackIndex) {
  const song = songs[trackIndex];
  if (!song?.lightning) globe.lightning.render(null, 0, 1);
  if (!song?.smog) globe.smog.render(null, 0, null);
  if (!song) {
    if (shownSong) showSong(null, null);
    return;
  }
  if (song.storm) {
    renderStorm(trackIndex, song);
    return;
  }
  if (song.lightning) {
    renderLightning(trackIndex, song);
    return;
  }
  if (song.smog) {
    renderSmog(trackIndex, song);
    return;
  }
  if (song.forest) {
    renderForest(trackIndex, song);
    return;
  }
  if (song.aerosol) {
    // The globe is drawn by renderAerosol; the music follows the clock.
    if (state === PlaybackState.PLAYING) soundEngine.follow(song, elapsedMs / 1000 - trackStartSec(album, trackIndex));
    return;
  }
  if (shownSong !== song) {
    showSong(song, album.tracks[trackIndex].color);
    globe.glide();
  }
  const elapsedSec = elapsedMs / 1000 - trackStartSec(album, trackIndex);
  const time = elapsedSec * album.msPerSec;
  globe.birds.render(song.tracks, time);
  dateLabel.show(time);
  focus = sampleFlock(song.tracks, time) ?? focus;
  if (!sounding()) return;
  soundEngine.follow(song, elapsedSec);
  halo.wake();
}

/**
 * Draws the storm at the clock, its wind and the date; the globe keeps it in the middle and the glow takes its colour.
 * While playing, the music follows it.
 */
function renderStorm(trackIndex, song) {
  const { durationSec } = album.tracks[trackIndex];
  if (shownSong !== song) {
    showSong(song, null);
    globe.glide();
  }
  const sec = elapsedMs / 1000 - trackStartSec(album, trackIndex);
  const time = stormTimeAt(song.track, sec, durationSec);
  const sample = sampleStorm(song.track, time);
  const fade = stormFadeAt(sec, durationSec);
  globe.storm.show({ sample, fade });
  const color = globe.storm.color;
  if (color) halo.setColor(color);
  dateLabel.show(time);
  focus = { lat: sample.lat, lon: sample.lon };
  if (!sounding()) return;
  soundEngine.follow(song, sec);
  halo.wake();
}

/**
 * Draws the year of lightning that plays at the clock on the globe, which looks at the equator from the track's side
 * of the Earth, with the date; while playing, lets the music follow it.
 */
function renderLightning(trackIndex, song) {
  if (shownSong !== song) {
    showSong(song, album.tracks[trackIndex].color);
    globe.glide();
  }
  focus = { lat: song.view.lat, lon: song.view.lon };
  const elapsedSec = elapsedMs / 1000 - trackStartSec(album, trackIndex);
  const time = song.startMs + elapsedSec * song.msPerSec;
  globe.lightning.render(song.season, time, song.msPerSec);
  dateLabel.show(time);
  if (!sounding()) return;
  soundEngine.follow(song, elapsedSec);
  halo.wake();
}

/**
 * Draws the smog around the city at the clock on the globe, which keeps the city in the middle, with the local date and
 * hour, under a glow the colour of its haze. While playing, lets the music follow it.
 */
function renderSmog(trackIndex, song) {
  if (shownSong !== song) {
    showSong(song, album.tracks[trackIndex].color);
    globe.glide();
  }
  focus = song.focus;
  const elapsedSec = elapsedMs / 1000 - trackStartSec(album, trackIndex);
  const time = song.startMs + elapsedSec * song.msPerSec;
  const { t, haze, clock } = song.track;
  globe.smog.render(song.track, time, song.city);
  dateLabel.show(hourlyAt(t, clock, time), song.dateFormat);
  halo.setColor(smogColor(hourlyAt(t, haze, time)));
  if (state !== PlaybackState.PLAYING) return;
  soundEngine.follow(song, elapsedSec);
  halo.wake();
}

/**
 * Draws the canopy and the noon meridian at the clock, the globe turned to keep the line facing the listener, and the
 * trees growing; while playing, lets the music follow it.
 */
function renderForest(trackIndex, song) {
  if (shownSong !== song) {
    showSong(song, album.tracks[trackIndex].color);
    globe.glide();
  }
  const elapsedSec = elapsedMs / 1000 - trackStartSec(album, trackIndex);
  const step = Math.max(0, elapsedSec / STEP_SEC);
  globe.forest.render(song, step, state === PlaybackState.PLAYING);
  // The equator under the noon line, in the fitted view. Playing, the line moves west at a steady pace, and a camera
  // easing after it with time constant τ trails it by τ of travel, so it aims τ ahead.
  const lead = state === PlaybackState.PLAYING ? FOREST_FOLLOW_TAU_SEC / STEP_SEC : 0;
  focus = { lat: 0, lon: lineLonAt(step + lead) };
  if (!sounding()) return;
  soundEngine.follow(song, elapsedSec);
  halo.wake();
}

/**
 * Tells a screen reader of a new album or track, which the eye sees on the sleeve: the album's place and title when
 * the album changes, the track and its album otherwise. The page's first album is left to the page itself, and a
 * track the docent is introducing aloud (see announceTrack) is left to the docent, so the two do not talk over each
 * other.
 *
 * @param {number} trackIndex
 */
function tellScreenReader(trackIndex) {
  const track = album.tracks[trackIndex];
  if (album === announcedAlbum && track === announcedTrack) return;
  const first = announcedAlbum === null;
  const newAlbum = album !== announcedAlbum;
  announcedAlbum = album;
  announcedTrack = track;
  if (first) return;
  if (docentOn && isPlaying()) return;
  if (newAlbum) announcer.say(`Album ${albumIndex + 1} of ${albums.length}: ${album.title}. Track: ${track.title}.`);
  else announcer.say(`${isPlaying() ? 'Now playing: ' : ''}${track.title}, from ${album.title}.`);
}

function setState(next) {
  if (next !== PlaybackState.PLAYING) music.stop();
  state = next;
  if (state !== PlaybackState.PLAYING) soundEngine.stop();
  syncVoice();
  mediaCenter.setPlaying(state === PlaybackState.PLAYING || state === PlaybackState.CUEING);
  playHint.render(state);
  playButton.render(state);
  render();
}

function tick(ts) {
  if (state !== PlaybackState.PLAYING) {
    ticker.stop();
    return;
  }
  const dtMs = lastFrameTs === null ? 0 : ts - lastFrameTs;
  // The docent's introduction plays on its own clock, the album's waiting at its start; past it, the music begins.
  if (introMs !== null) {
    lastFrameTs = ts;
    introMs += dtMs;
    // It ends when the voice does (see syncVoice); with no voice heard, after the words' estimated length.
    const introSec = docentIntroLength(album.id, album.title, ALBUM_NOTES[album.id]?.docentTip);
    if (!docentNarrator.speaking && introMs >= introSec * 1000) {
      finishIntro();
      return;
    }
    render();
    if (!globe.gliding) globe.follow(dtMs / 1000, shownSong?.followTauSec);
    return;
  }
  // The ice and sea music sets the clock while it plays, so the globe follows what is heard; otherwise the frames do.
  const heardSec = music.positionSec();
  if (heardSec !== null) elapsedMs = heardSec * 1000;
  else elapsedMs += dtMs;
  lastFrameTs = ts;
  // The album's last track has ended: the record changes and the next album plays from its first track.
  if (elapsedMs >= totalMs) {
    playNextAlbum(1);
    return;
  }
  render();
  if (!globe.gliding) globe.follow(dtMs / 1000, shownSong?.followTauSec);
}

showAlbum(albumIndex);
setDocent(DOCENT_ON_AT_START);
setState(PlaybackState.STOPPED);
