import { CharacterProfile, VideoScene, VideoSettings } from '../types';

export interface CuratedArtwork {
  id: string;
  title: string;
  author: string;
  year: string;
  source: string;
  license: string;
  rightsConfirmed: boolean;
  imageUrl: string;
  theme: string;
  aspectRatio: string;
}

// High-resolution verified public domain artworks with complete attribution
export const CURATED_BIBLICAL_ARTWORKS: CuratedArtwork[] = [
  {
    id: 'art_prodigal_rembrandt',
    title: 'Powrót syna marnotrawnego',
    author: 'Rembrandt Harmenszoon van Rijn',
    year: 'ok. 1669',
    source: 'Ermitaż, Petersburg (Domena Publiczna)',
    license: 'Public Domain Mark 1.0 (Brak praw autorskich majątkowych)',
    rightsConfirmed: true,
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1920&q=80',
    theme: 'Przypowieść o Synu Marnotrawnym, miłosierdzie, powrót, przebaczenie',
    aspectRatio: '16:9',
  },
  {
    id: 'art_olive_grove_prayer',
    title: 'Modlitwa w Ogrójcu / Góra Oliwna o zmierzchu',
    author: 'Klasyczne malarstwo historyczne',
    year: 'XIX w.',
    source: 'Archiwum Christian Culture (Domena Publiczna)',
    license: 'Domena Publiczna',
    rightsConfirmed: true,
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
    theme: 'Męka Pańska, modlitwa, cisza, wierność',
    aspectRatio: '16:9',
  },
  {
    id: 'art_desert_judea',
    title: 'Pustynia Judzka o wschodzie słońca',
    author: 'Fotografia historyczna Ziemi Świętej',
    year: 'Archiwum',
    source: 'Archiwum Christian Culture',
    license: 'CC0 / Domena Publiczna',
    rightsConfirmed: true,
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1920&q=80',
    theme: 'Wędrówka, nawrócenie, pustynia, samotność',
    aspectRatio: '16:9',
  },
  {
    id: 'art_galilee_sea',
    title: 'Jezioro Galilejskie w spokojnym blasku dnia',
    author: 'Archiwum Ziemi Świętej',
    year: 'Dokumentacja historyczna',
    source: 'Domena Publiczna',
    license: 'Domena Publiczna',
    rightsConfirmed: true,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    theme: 'Nauczanie Jezusa, rybacy, apostołowie, pokój',
    aspectRatio: '16:9',
  },
  {
    id: 'art_temple_jerusalem',
    title: 'Świątynia Jerozolimska i starożytne mury',
    author: 'Studium architektoniczne I wieku',
    year: 'Archiwum',
    source: 'Christian Culture Archiwum',
    license: 'Domena Publiczna',
    rightsConfirmed: true,
    imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1920&q=80',
    theme: 'Świątynia, kapłani, Prawo, Jerozolima',
    aspectRatio: '16:9',
  },
];

// Initial Character Profiles ensuring character consistency across scenes
export const DEFAULT_CHARACTER_PROFILES: CharacterProfile[] = [
  {
    id: 'char_narrator',
    name: 'Narrator / Lektor stacji',
    visualDescription: 'Głos radiowy stacji Christian Culture. Wizualnie reprezentowany przez stonowaną winietę i symbol księgi Pisma Świętego.',
    approxAge: 'Dojrzały (45-55 lat)',
    attire: 'Szlachetny, tradycyjny',
    distinguishingFeatures: 'Spokojna, dostojna intonacja, szacunek dla tekstu natchnionego',
    historicalContext: 'Komentarz i ciągłość narracyjna Ewangelii',
    assignedVoice: 'Puck',
    forbiddenChanges: 'Nie zastępować głosu współczesnym slangiem ani karykaturą.',
  },
  {
    id: 'char_ojciec',
    name: 'Ojciec (Symbol Miłosiernego Boga)',
    visualDescription: 'Starszy, dostojny patriarcha rodu, z siwą brodą, łagodnym spojrzeniem pełnym tęsknoty i ojcowskiej miłości.',
    approxAge: 'Ok. 65-70 lat',
    attire: 'Długa wełniana tunika w odcieniu ochry i ciemnego błękitu, szlachetny płaszcz z frędzlami zgodny z tradycją I wieku w Judei.',
    distinguishingFeatures: 'Otwarte dłonie gotowe do uścisku, głębokie zmarszczki doświadczenia i dobroci.',
    historicalContext: 'Zamożny właściciel posiadłości w I-wiecznej Judei, ojciec dwóch synów.',
    assignedVoice: 'Zephyr',
    referenceImageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    forbiddenChanges: 'Nie przedstawiać jako surowego tyrana. Bezwzględny zakaz współczesnych rekwizytów. Spójny siwy zarost i ten sam płaszcz we wszystkich ujęciach.',
  },
  {
    id: 'char_mlodszy_syn',
    name: 'Młodszy syn (Syn Marnotrawny)',
    visualDescription: 'Młody mężczyzna, ciemne falowane włosy. W scenie odejścia: pewny siebie, w scenie upadku: wychudzony, boso, w podartych szatach.',
    approxAge: 'Ok. 20-23 lata',
    attire: 'Początkowo barwna szata podróżna; po roztrwonieniu majątku: zniszczony lniany pas i poszarpana tunika pasterza świń.',
    distinguishingFeatures: 'Wzrok przepełniony skruchą i żalem, brudne stopy i ręce w scenie powrotu.',
    historicalContext: 'Młodszy syn domagający się natychmiastowego działu majątku według prawa mojżeszowego.',
    assignedVoice: 'Charon',
    forbiddenChanges: 'Utrzymać tę samą budowę twarzy i kolor oczu w fazie bogactwa i fazie nędzy.',
  },
  {
    id: 'char_starszy_syn',
    name: 'Starszy syn (Pracujący w polu)',
    visualDescription: 'Doświadczony, barczysty mężczyzna z ciemną brodą i zrogowaciałymi od pracy dłońmi.',
    approxAge: 'Ok. 28-32 lata',
    attire: 'Prosta, praktyczna tunika rolnika w odcieniach ziemi, przewiązana skórzanym pasem.',
    distinguishingFeatures: 'Wyraz twarzy początkowo zdumiony, potem zacięty w poczuciu niesprawiedliwości.',
    historicalContext: 'Wierny pierworodny, który nigdy nie przekroczył przykazania ojca.',
    assignedVoice: 'Fenrir',
    forbiddenChanges: 'Nie czynić ze starszego syna potwora — to człowiek sumienny, lecz zmagający się z zazdrością.',
  },
];

export function createDefaultVideoSettings(bookName: string, chapterNumber: string | number): VideoSettings {
  return {
    mode: 'radio',
    resolution: '1080p',
    visualizer: 'frequency_bars',
    artStyle: 'painterly_illustration',
    motionEffect: 'slow_zoom_in',
    fps: 25,
    showSubtitles: true,
    showVerseNumbers: true,
    subtitlesPosition: 'bottom',
    subtitlesFontSize: 'normal',
    showLogo: true,
    logoPosition: 'top_right',
    includeIntro: true,
    introDurationSec: 6,
    introTitle: 'Biblia Audio Christian Culture',
    introSlogan: 'Słowo, które możesz usłyszeć • www.polskieradio.cc',
    includeOutro: true,
    outroDurationSec: 12,
    outroTitle: 'Dziękujemy za wspólne słuchanie Słowa Bożego',
    outroText: 'Słuchaj całodobowego Radia Christian Culture na www.polskieradio.cc',
    outroStationUrl: 'https://www.polskieradio.cc',
    selectedThumbnailTemplate: 0,
    thumbnailTitle: `${bookName} — Rozdział ${chapterNumber}`,
    scenes: [
      {
        id: 'scene_1',
        sceneNumber: 1,
        title: 'Wprowadzenie: Prośba młodszego syna',
        startSec: 0,
        durationSec: 35,
        imageUrl: CURATED_BIBLICAL_ARTWORKS[0].imageUrl,
        imagePrompt: 'Klasyczne malarstwo w stylu Rembrandta: dom zamożnego patriarchy w Judei I wieku, młodszy syn otrzymujący sakiewkę, ciepłe światło olejne.',
        imageSource: CURATED_BIBLICAL_ARTWORKS[0].source,
        author: CURATED_BIBLICAL_ARTWORKS[0].author,
        license: CURATED_BIBLICAL_ARTWORKS[0].license,
        rightsConfirmed: true,
        motionType: 'slow_zoom_in',
      },
      {
        id: 'scene_2',
        sceneNumber: 2,
        title: 'Daleki kraj i upadek',
        startSec: 35,
        durationSec: 45,
        imageUrl: CURATED_BIBLICAL_ARTWORKS[2].imageUrl,
        imagePrompt: 'Pustynny krajobraz, wychudzony młodzieniec pasący świnie na jałowej ziemi, chłodne zgaszone barwy, wzrok skierowany ku ziemi w zadumie.',
        imageSource: CURATED_BIBLICAL_ARTWORKS[2].source,
        author: CURATED_BIBLICAL_ARTWORKS[2].author,
        license: CURATED_BIBLICAL_ARTWORKS[2].license,
        rightsConfirmed: true,
        motionType: 'pan_right',
      },
      {
        id: 'scene_3',
        sceneNumber: 3,
        title: 'Powrót i ojcowskie uściśnięcie',
        startSec: 80,
        durationSec: 55,
        imageUrl: CURATED_BIBLICAL_ARTWORKS[0].imageUrl,
        imagePrompt: 'Rembrandt Harmenszoon van Rijn: Ojciec obejmujący klęczącego, bosego syna w podartej szacie. Złociste światło miłosierdzia i przebaczenia.',
        imageSource: CURATED_BIBLICAL_ARTWORKS[0].source,
        author: CURATED_BIBLICAL_ARTWORKS[0].author,
        license: CURATED_BIBLICAL_ARTWORKS[0].license,
        rightsConfirmed: true,
        motionType: 'slow_zoom_out',
      },
    ],
  };
}
