(() => {
  "use strict";

  const OFFICIAL = "https://raw.githubusercontent.com/LaQuay/TDTChannels/master/TELEVISION.md";
  const EPG_URL = "https://www.tdtchannels.com/epg/TV.json";
  const PRINCIPALES = new Set(["Generalistas", "Informativos", "Deportivos", "Infantiles"]);
  const CA_GROUPS = new Set([
    "C. de Madrid", "Castilla-La Mancha", "Castilla y León", "C. Valenciana",
    "Cataluña", "Andalucía", "Aragón", "Canarias", "Cantabria", "Extremadura",
    "Galicia", "Illes Balears", "La Rioja", "C. Foral de Navarra", "País Vasco",
    "P. de Asturias", "R. de Murcia", "Melilla"
  ]);
  const AUTONOMICO_RE = [
    /^tv3\b/i,
    /^33\b/i,
    /^3cat\b/i,
    /^canal sur\b/i,
    /^7tv andaluc/i,
    /^etb/i,
    /^tvg\b/i,
    /^arag[oó]n tv\b/i,
    /^arag[oó]n noticias\b/i,
    /^castilla-la mancha media\b/i,
    /^castilla-la mancha radio\b/i,
    /^tv canaria\b/i,
    /^la [12] canarias\b/i,
    /^24h canarias\b/i,
    /^canal extremadura\b/i,
    /^ib3\b/i,
    /^[aà] punt\b/i,
    /^telemadrid\b/i,
    /^la otra\b/i,
    /^tpa\b/i,
    /^7rm\b/i,
    /^7 regi[oó]n de murcia\b/i,
    /^navarra televisi/i,
    /^tv rioja\b/i,
    /^cyltv\b/i,
    /^parlamento de navarra\b/i,
    /^parlamento de la rioja\b/i,
    /^cortes de castilla/i,
    /^junta castilla/i,
    /^junta general del principado/i,
    /^consejo de gobierno de la regi/i,
    /^euskadi meteo/i
  ];
  const GROUP_ORDER = [
    "Generalistas", "Informativos", "Deportivos", "Infantiles",
    "Autonómicos", "Regionales",
    "Deportivos Int.", "Musicales", "Rakuten", "Religiosos", "Eventuales",
    "Int. Europa", "Int. América", "Int. Asia", "Int. África", "Int. Otros"
  ];
  const TONES = ["#6e4634", "#3e5648", "#3d4c66", "#654838", "#534258", "#5a5140", "#4a4038"];
  const HOUR = 176;
  const EXTERNAL_CHANNELS = [
    {
      name: "Antena 3",
      id: "",
      group: "Generalistas",
      logo: "https://graph.facebook.com/antena3/picture?width=200&height=200",
      platform: "Atresplayer",
      external: "https://www.atresplayer.com/directos/antena3/"
    },
    {
      name: "Cuatro",
      id: "Cuatro.TV",
      group: "Generalistas",
      logo: "https://graph.facebook.com/cuatro/picture?width=200&height=200",
      platform: "Mediaset Infinity",
      external: "https://www.mediasetinfinity.es/directo/cuatro/"
    },
    {
      name: "Telecinco",
      id: "Telecinco.TV",
      group: "Generalistas",
      logo: "https://graph.facebook.com/tele5/picture?width=200&height=200",
      platform: "Mediaset Infinity",
      external: "https://www.mediasetinfinity.es/directo/telecinco/"
    },
    {
      name: "laSexta",
      id: "",
      group: "Generalistas",
      logo: "https://graph.facebook.com/laSexta/picture?width=200&height=200",
      platform: "Atresplayer",
      external: "https://www.atresplayer.com/directos/lasexta/"
    },
    {
      name: "Neox",
      id: "",
      group: "Generalistas",
      logo: "https://graph.facebook.com/Neox/picture?width=200&height=200",
      platform: "Atresplayer",
      external: "https://www.atresplayer.com/directos/neox/"
    },
    {
      name: "Nova",
      id: "",
      group: "Generalistas",
      logo: "https://graph.facebook.com/NovaTDT/picture?width=200&height=200",
      platform: "Atresplayer",
      external: "https://www.atresplayer.com/directos/nova/"
    },
    {
      name: "Mega",
      id: "",
      group: "Generalistas",
      logo: "https://graph.facebook.com/MegaTDT/picture?width=200&height=200",
      platform: "Atresplayer",
      external: "https://www.atresplayer.com/directos/mega/"
    },
    {
      name: "FDF",
      id: "FDF.TV",
      group: "Generalistas",
      logo: "https://graph.facebook.com/factoriadeficcion/picture?width=200&height=200",
      platform: "Mediaset Infinity",
      external: "https://www.mitele.es/directo/fdf"
    },
    {
      name: "Energy",
      id: "Energy.TV",
      group: "Generalistas",
      logo: "https://graph.facebook.com/E.EnergyTV/picture?width=200&height=200",
      platform: "Mediaset Infinity",
      external: "https://www.mitele.es/directo/energy"
    },
    {
      name: "Divinity",
      id: "Divinity.TV",
      group: "Generalistas",
      logo: "https://graph.facebook.com/divinityes/picture?width=200&height=200",
      platform: "Mediaset Infinity",
      external: "https://www.mitele.es/directo/divinity"
    },
    {
      name: "Be Mad",
      id: "Bemad.TV",
      group: "Generalistas",
      logo: "https://graph.facebook.com/BeMadTV/picture?width=200&height=200",
      platform: "Mediaset Infinity",
      external: "https://www.mitele.es/directo/bemad"
    },
    {
      name: "Boing",
      id: "Boing.TV",
      group: "Infantiles",
      logo: "https://graph.facebook.com/BoingTV/picture?width=200&height=200",
      platform: "Mediaset Infinity",
      external: "https://www.mitele.es/directo/boing"
    },
    {
      name: "Atreseries",
      id: "",
      group: "Generalistas",
      logo: "https://graph.facebook.com/Atreseries/picture?width=200&height=200",
      platform: "Atresplayer",
      external: "https://www.atresplayer.com/directos/atreseries/"
    },
    {
      name: "Telemadrid",
      id: "Telemadrid.TV",
      group: "Autonómicos",
      region: "C. de Madrid",
      logo: "https://graph.facebook.com/telemadrid/picture?width=200&height=200",
      platform: "TLMad+",
      external: "https://www.tlmad.es/pages/live/telemadrid"
    },
    {
      name: "La Otra",
      id: "LaOtra.TV",
      group: "Autonómicos",
      region: "C. de Madrid",
      logo: "https://pbs.twimg.com/profile_images/1279727978268839938/jSZUiboT_200x200.jpg",
      platform: "TLMad+",
      external: "https://www.tlmad.es/pages/live/laotra"
    },
    {
      name: "TPA7",
      id: "TPA.TV",
      group: "Autonómicos",
      region: "P. de Asturias",
      logo: "https://graph.facebook.com/RTPAoficial/picture?width=200&height=200",
      platform: "RTPA",
      external: "https://www.rtpa.es/tpa-television"
    },
    {
      name: "Navarra TV",
      id: "NaTV.TV",
      group: "Autonómicos",
      region: "C. Foral de Navarra",
      logo: "https://graph.facebook.com/NavarraTelevision/picture?width=200&height=200",
      platform: "Navarra TV",
      external: "https://www.navarratelevision.es/Directo"
    },
    {
      name: "7 La Rioja",
      id: "7Rioja.TV",
      group: "Autonómicos",
      region: "La Rioja",
      logo: "https://graph.facebook.com/7riojatv/picture?width=200&height=200",
      platform: "7 Rioja",
      external: "https://www.7rioja.tv/Directo"
    },
    {
      name: "CyLTV",
      id: "",
      group: "Autonómicos",
      region: "Castilla y León",
      logo: "https://graph.facebook.com/cyltelevision/picture?width=200&height=200",
      platform: "CyLTV Play",
      external: "https://www.cyltvplay.es/"
    },
    {
      name: "La 7",
      id: "",
      group: "Autonómicos",
      region: "R. de Murcia",
      logo: "https://graph.facebook.com/7TelevisionRegiondeMurcia/picture?width=200&height=200",
      platform: "La 7 TV",
      external: "https://www.la7tv.es/"
    }
  ];
  const EXTRA_CHANNELS = [
    {
      name: "À Punt",
      id: "APUNT.TV",
      group: "Autonómicos",
      region: "C. Valenciana",
      logo: "https://graph.facebook.com/apuntmedia/picture?width=200&height=200",
      urls: [
        "https://fastly.live.brightcove.com/1846756479408303045/eu-central-1/6057955885001/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJob3N0IjoiZWFxNWh4LmVncmVzcy53YzQ3bTEiLCJhY2NvdW50X2lkIjoiNjA1Nzk1NTg4NTAwMSIsImVobiI6ImZhc3RseS5saXZlLmJyaWdodGNvdmUuY29tIiwiaXNzIjoiYmxpdmUtcGxheWJhY2stc291cmNlLWFwaSIsInN1YiI6InBhdGhtYXB0b2tlbiIsImF1ZCI6WyI2MDU3OTU1ODg1MDAxIl0sImp0aSI6IjE4NDY3NTY0Nzk0MDgzMDMwNDUifQ.o6wb_VA-TVxl3ERgr7FKLlaTjY7smErmsf73QAydySE/playlist-hls-dvr.m3u8"
      ],
      external: "https://www.apuntmedia.es/directe/directe-tv_136_1392524.html",
      platform: "À Punt"
    },
    {
      name: "La 2 Cat",
      id: "La2_CAT.TV",
      group: "Autonómicos",
      region: "Cataluña",
      logo: "https://yt3.googleusercontent.com/ytc/AIdro_kqgHWySi5xprs1VFCNCX0IKNT8yXBLZC43JMoB8j0JUto=s200",
      urls: ["https://rtvelivestream.rtve.es/rtvesec/cat/la2_cat_main_dvr.m3u8"]
    },
    {
      name: "IB3 Global",
      id: "IB3.TV",
      group: "Autonómicos",
      region: "Illes Balears",
      logo: "https://graph.facebook.com/IB3org/picture?width=200&height=200",
      youtube: "UCff_CBVJDTHP4wOHPjP5BMg",
      external: "https://ib3.org/directe",
      platform: "IB3"
    },
    {
      name: "Xaloa Telebista",
      id: "",
      group: "Regionales",
      region: "País Vasco",
      logo: "https://graph.facebook.com/xaloatb/picture?width=200&height=200",
      urls: ["https://streaming.mediacast.pro/live/xaloa/playlist.m3u8"]
    },
    {
      name: "Cadena SER",
      id: "",
      group: "Informativos",
      logo: "https://graph.facebook.com/cadenaser/picture?width=200&height=200",
      youtube: "UCQ2Fej5pr1ipVeBWTX8Sc_Q"
    },
    {
      name: "Sky News Reino Unido",
      id: "",
      group: "Int. Europa",
      logo: "https://graph.facebook.com/skynews/picture?width=200&height=200",
      urls: [
        "https://dqco14bu26p3z.cloudfront.net/30505/89006005/hls/master.m3u8?ads.xumo_channelId=89006005&ads.xumo_streamId=89006005"
      ]
    },
    {
      name: "Bloomberg Europe",
      id: "Bloom.TV",
      group: "Int. Europa",
      logo: "https://pbs.twimg.com/profile_images/991792042094354432/DG1Ruupb_200x200.jpg",
      urls: ["https://www.bloomberg.com/media-manifest/streams/eu.m3u8"]
    },
    {
      name: "France 24",
      id: "France24.TV",
      group: "Int. Europa",
      logo: "https://graph.facebook.com/FRANCE24/picture?width=200&height=200",
      youtube: "UCUdOoVWuWmgo1wByzcsyKDQ"
    },
    {
      name: "Telemadrid Internacional",
      id: "TeleMadridInt.TV",
      group: "Int. Europa",
      logo: "https://graph.facebook.com/telemadrid/picture?width=200&height=200",
      youtube: "UCv2BcgqxHSrl2QQfIkjR5Eg",
      external: "https://www.tlmad.es/pages/live/internacional",
      platform: "TLMad+"
    },
    {
      name: "Islas Canarias TV",
      id: "",
      group: "Int. Europa",
      logo: "https://graph.facebook.com/IslasCanariasTelevision/picture?width=200&height=200",
      urls: ["https://stream-us-east-1.getpublica.com/playlist.m3u8?network_id=17089&live=1"]
    },
    {
      name: "NHK World Japón",
      id: "",
      group: "Int. Asia",
      logo: "https://graph.facebook.com/nhkworld/picture?width=200&height=200",
      urls: ["https://media-tyo.hls.nhkworld.jp/hls/w/live/master.m3u8"]
    },
    {
      name: "NASA+",
      id: "",
      group: "Int. América",
      logo: "https://graph.facebook.com/NASA/picture?width=200&height=200",
      youtube: "UCLA_DiR1FfKNvjuUpBHmylQ"
    },
    {
      name: "Rakuten Acción",
      id: "",
      group: "Rakuten",
      urls: ["https://a9c57ec7ec5e4b7daeacc6316a0bb404.mediatailor.eu-west-1.amazonaws.com/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6069/master.m3u8"]
    },
    {
      name: "Rakuten Cine Español",
      id: "",
      group: "Rakuten",
      urls: ["https://3ed8837c27bf41dabe8e2627be2e57e6.mediatailor.eu-west-1.amazonaws.com/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6196/master.m3u8"]
    },
    {
      name: "Rakuten Comedia",
      id: "",
      group: "Rakuten",
      urls: ["https://71db867f03ce4d71a29e92155f07ab87.mediatailor.eu-west-1.amazonaws.com/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6180/master.m3u8"]
    },
    {
      name: "Rakuten Crimen",
      id: "",
      group: "Rakuten",
      urls: ["https://4ac0fe739f05408abf89ce151aced344.mediatailor.eu-west-1.amazonaws.com/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6220/master.m3u8"]
    },
    {
      name: "Rakuten Drama",
      id: "",
      group: "Rakuten",
      urls: ["https://a7089c89d85f453d850c4a1518b43076.mediatailor.eu-west-1.amazonaws.com/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6092/master.m3u8"]
    },
    {
      name: "Rakuten Familia",
      id: "",
      group: "Rakuten",
      urls: ["https://b0d59c8c98974e708e5ccb9a27cdfdfc.mediatailor.eu-west-1.amazonaws.com/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6205/master.m3u8"]
    },
    {
      name: "Rakuten Romance",
      id: "",
      group: "Rakuten",
      urls: ["https://4b95c0f7aa2b4cae80f6515600154151.mediatailor.eu-west-1.amazonaws.com/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6105/master.m3u8"]
    },
    {
      name: "Rakuten Sci-Fi",
      id: "",
      group: "Rakuten",
      urls: ["https://sci-fi-rakuten-tv-es.fast.rakuten.tv/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6740/master.m3u8"]
    },
    {
      name: "Rakuten Thriller",
      id: "",
      group: "Rakuten",
      urls: ["https://thriller-rakuten-tv-es.fast.rakuten.tv/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6480/master.m3u8"]
    },
    {
      name: "Rakuten Top Movies",
      id: "",
      group: "Rakuten",
      urls: ["https://ff335120300e4742a2b135ee9a9e7df8.mediatailor.eu-west-1.amazonaws.com/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-5983/master.m3u8"]
    },
    {
      name: "Vevo Latino",
      id: "",
      group: "Musicales",
      urls: ["https://amg00056-amg00056c13-rakuten-es-3246.playouts.now.amagi.tv/playlist.m3u8"]
    },
    {
      name: "Vevo Pop",
      id: "",
      group: "Musicales",
      urls: ["https://amg00056-amg00056c10-rakuten-es-3242.playouts.now.amagi.tv/playlist.m3u8"]
    },
    {
      name: "Beyblade",
      id: "",
      group: "Infantiles",
      urls: ["https://amg01796-amg01796c8-rakuten-es-5333.playouts.now.amagi.tv/playlist/amg01796-fastmediafast-beybladees-rakutenes/playlist.m3u8"]
    },
    {
      name: "Mr. Bean Anime",
      id: "",
      group: "Infantiles",
      urls: ["https://amg00627-amg00627c30-rakuten-es-3990.playouts.now.amagi.tv/playlist/amg00627-banijayfast-mrbeanescc-rakutenes/playlist.m3u8"]
    },
    {
      name: "Yu-Gi-Oh!",
      id: "",
      group: "Infantiles",
      urls: ["https://amg01796-amg01796c18-rakuten-es-7491.playouts.now.amagi.tv/playlist/amg01796-fastmediafast-yugiohees-rakutenes/playlist.m3u8"]
    },
    {
      name: "Zylo Cine Friki",
      id: "",
      group: "Rakuten",
      urls: ["https://d2mr4fu91mjx9m.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-rb0tx75ojbc5u/CineFriki_ES.m3u8"]
    },
    {
      name: "Zylo Cine Western",
      id: "",
      group: "Rakuten",
      urls: ["https://d2nq34q0i1r3la.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-awohw8g217ho8/CineWestern_ES.m3u8"]
    },
    {
      name: "Zylo Todo Novelas",
      id: "",
      group: "Rakuten",
      urls: ["https://dtsszjrztq9ti.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-yshah5p4v45g1/ToDoNovelas_ES.m3u8"]
    },
    {
      name: "People are Awesome",
      id: "",
      group: "Rakuten",
      urls: ["https://jukin-peopleareawesome-2-es.samsung.wurl.tv/playlist.m3u8"]
    },
    {
      name: "The Pet Collective",
      id: "",
      group: "Rakuten",
      urls: ["https://the-pet-collective-international-es.samsung.wurl.tv/playlist.m3u8"]
    },
    {
      name: "BBC Drama",
      id: "",
      group: "Rakuten",
      urls: ["https://amg00793-amg00793c40-rakuten-es-5444.playouts.now.amagi.tv/playlist.m3u8"]
    },
    {
      name: "CGTN Español",
      id: "",
      group: "Rakuten",
      urls: ["https://amg01314-cgtn-amg01314c3-rakuten-uk-1318.playouts.now.amagi.tv/cgtn-es-rakuten/playlist.m3u8"]
    },
    {
      name: "Crímenes Reales",
      id: "",
      group: "Rakuten",
      urls: ["https://amg01796-amg01796c13-rakuten-gb-6739.playouts.now.amagi.tv/playlist.m3u8"]
    },
    {
      name: "Estilo y Vida",
      id: "",
      group: "Rakuten",
      urls: ["https://4a7284f0c8334835adb8f223c36fbc37.mediatailor.eu-west-1.amazonaws.com/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6232/master.m3u8"]
    },
    {
      name: "Grjngo",
      id: "",
      group: "Rakuten",
      urls: ["https://amogo-networx-grjngopelculasdeloeste-1-es.rakuten.wurl.tv/playlist.m3u8"]
    },
    {
      name: "Ideas en 5 minutos",
      id: "",
      group: "Rakuten",
      urls: ["https://soul-5mincraftspa-rakuten.amagi.tv/playlist.m3u8"]
    },
    {
      name: "Lone Star",
      id: "",
      group: "Rakuten",
      urls: ["https://lonestar-rakuten.amagi.tv/playlist.m3u8"]
    },
    {
      name: "Los Gipsy Kings",
      id: "",
      group: "Rakuten",
      urls: ["https://gipsy-kings-rakuten-tv-es.fast.rakuten.tv/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6752/master.m3u8"]
    },
    {
      name: "Nature Time",
      id: "",
      group: "Rakuten",
      urls: ["https://amg00090-amgnaturetimeemea-rakuten.amagi.tv/playlist.m3u8"]
    },
    {
      name: "Travelxp",
      id: "",
      group: "Rakuten",
      urls: ["https://travelxp-travelxp-5-eu.rakuten.wurl.tv/playlist.m3u8"]
    }
  ];
  const FRONT_ORDER = [
    "La 1", "La 2", "Antena 3", "Cuatro", "Telecinco", "laSexta",
    "Neox", "Nova", "Mega", "FDF", "Energy", "Divinity", "Be Mad", "Atreseries",
    "TRECE", "El Toro TV", "RNE para todos"
  ];
  const INFANTILES_ORDER = ["Clan", "Boing", "SX3"];

  const $ = (id) => document.getElementById(id);
  const video = $("video");

  const state = {
    channels: [],
    filter: "Principales",
    query: "",
    current: 0,
    epg: {},
    epgUpdated: 0,
    epgLive: false,
    playToken: 0,
    phase: "idle",
    overlayMode: "idle",
    youtubePending: null,
    hls: null,
    osdTimer: null,
    digits: "",
    digitTimer: null,
    lastWheel: 0,
    guideDay: "",
    guideMap: new Map(),
    picked: null,
    officialRows: null,
    officialAt: 0,
    officialTask: null
  };

  function norm(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    } catch (err) { /* ignore */ }
    return "";
  }

  function initials(name) {
    const parts = String(name).replace(/[^\p{L}\p{N} ]+/gu, " ").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "TV";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function tone(name) {
    let hash = 0;
    const text = norm(name);
    for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    return TONES[hash % TONES.length];
  }

  function isAutonomicoName(name) {
    const text = String(name || "");
    return AUTONOMICO_RE.some((re) => re.test(text));
  }

  function remapCommunity(ch) {
    if (!CA_GROUPS.has(ch.group)) {
      return { ...ch, region: ch.region || "" };
    }
    return {
      ...ch,
      region: ch.group,
      group: isAutonomicoName(ch.name) ? "Autonómicos" : "Regionales"
    };
  }

  function sortGroups(groups) {
    const rank = new Map(GROUP_ORDER.map((name, index) => [name, index]));
    return [...groups].sort((a, b) => (rank.get(a) ?? 500) - (rank.get(b) ?? 500) || a.localeCompare(b, "es"));
  }

  function logoHtml(name, src, className) {
    const url = safeUrl(src);
    const img = url ? `<img alt="" src="${esc(url)}" loading="lazy">` : "";
    return `<span class="logo ${className || ""}" style="--tone:${tone(name)}"><span>${esc(initials(name))}</span>${img}</span>`;
  }

  function isExternal(ch) {
    return Boolean(ch && ch.external);
  }

  function isExternalOnly(ch) {
    return Boolean(
      ch
      && ch.external
      && !(ch.urls && ch.urls.length)
      && !ch.youtube
    );
  }

  function hasPlayableSource(ch) {
    return Boolean((ch.urls && ch.urls.length) || ch.youtube);
  }

  function normalizeSupplement(ch) {
    return {
      name: ch.name,
      id: ch.id || "",
      group: ch.group,
      region: ch.region || "",
      logo: ch.logo || "",
      urls: (ch.urls || []).slice(),
      youtube: ch.youtube || null,
      external: ch.external || null,
      platform: ch.platform || null
    };
  }

  function orderGroup(items, preferred) {
    const map = new Map(items.map((ch) => [norm(ch.name), ch]));
    const ordered = [];
    const used = new Set();
    preferred.forEach((name) => {
      const key = norm(name);
      const ch = map.get(key);
      if (!ch || used.has(key)) return;
      ordered.push(ch);
      used.add(key);
    });
    items.forEach((ch) => {
      const key = norm(ch.name);
      if (used.has(key)) return;
      ordered.push(ch);
      used.add(key);
    });
    return ordered;
  }

  function orderByRegion(items, preferredRegions) {
    const preferred = preferredRegions.map((name) => norm(name));
    const buckets = preferred.map(() => []);
    const rest = [];
    items.forEach((ch) => {
      const key = norm(ch.region || "");
      const index = preferred.indexOf(key);
      if (index >= 0) buckets[index].push(ch);
      else rest.push(ch);
    });
    return [...buckets.flat(), ...rest];
  }

  function mergeChannels(base) {
    const supplements = [
      ...EXTERNAL_CHANNELS.map(normalizeSupplement),
      ...EXTRA_CHANNELS.map(normalizeSupplement)
    ];
    const byName = new Map();
    [...base.map(remapCommunity), ...supplements].forEach((ch) => {
      const key = norm(ch.name);
      const incoming = {
        ...ch,
        urls: (ch.urls || []).slice(),
        region: ch.region || "",
        youtube: ch.youtube || null,
        external: ch.external || null,
        platform: ch.platform || null
      };
      const prev = byName.get(key);
      if (!prev || isExternalOnly(incoming) || hasPlayableSource(incoming)) {
        byName.set(key, incoming);
      }
    });
    const all = [...byName.values()];
    const groups = sortGroups([...new Set(all.map((ch) => ch.group))]);
    const ordered = [];
    groups.forEach((group) => {
      let items = all.filter((ch) => ch.group === group);
      if (group === "Generalistas") items = orderGroup(items, FRONT_ORDER);
      else if (group === "Infantiles") items = orderGroup(items, INFANTILES_ORDER);
      else if (group === "Autonómicos" || group === "Regionales") {
        items = orderByRegion(items, ["Galicia"]);
      }
      ordered.push(...items);
    });
    return ordered.map((ch, index) => ({ ...ch, n: index + 1 }));
  }

  function stopPlayback() {
    destroyHls();
    hideYoutube();
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  function current() {
    return state.channels[state.current] || state.channels[0];
  }

  function visibleChannels() {
    const query = norm(state.query);
    return state.channels.filter((ch) => {
      if (state.filter === "Principales" && !PRINCIPALES.has(ch.group)) return false;
      if (state.filter !== "Principales" && state.filter !== "Todos" && ch.group !== state.filter) return false;
      if (!query) return true;
      return norm(ch.name).includes(query)
        || norm(ch.group).includes(query)
        || norm(ch.region).includes(query);
    });
  }

  function programmes(id) {
    return (id && state.epg[id]) || [];
  }

  function nowAndNext(id, now) {
    const list = programmes(id);
    const ts = now == null ? Date.now() / 1000 : now;
    let currentProg = null;
    let nextProg = null;
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      if (item[0] <= ts && ts < item[1]) currentProg = item;
      else if (item[0] > ts) {
        nextProg = item;
        break;
      }
    }
    return { currentProg, nextProg };
  }

  function formatHM(ts) {
    return new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).format(new Date(ts * 1000));
  }

  function madridParts(utcMs) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const parts = Object.fromEntries(dtf.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
    return {
      year: +parts.year,
      month: +parts.month,
      day: +parts.day,
      hour: +parts.hour,
      minute: +parts.minute,
      second: +parts.second
    };
  }

  function madridKey(ms) {
    const p = madridParts(ms);
    return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  }

  function addDays(key, days) {
    const [y, m, d] = key.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days));
    return dt.toISOString().slice(0, 10);
  }

  function madridMidnightMs(key) {
    const [y, m, d] = key.split("-").map(Number);
    let utc = Date.UTC(y, m - 1, d, 0, 0, 0);
    for (let i = 0; i < 3; i += 1) {
      const p = madridParts(utc);
      const asIf = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
      utc += Date.UTC(y, m - 1, d, 0, 0, 0) - asIf;
    }
    return utc;
  }

  function hostname(url) {
    try {
      const parts = new URL(url).hostname.replace(/^www\./, "").split(".");
      return parts.length > 2 ? parts.slice(-2).join(".") : parts.join(".");
    } catch (err) { return ""; }
  }

  function setSignal(text) {
    $("signal").textContent = text;
  }

  function setNote(text) {
    $("list-note").textContent = text;
  }

  function showToast(text) {
    const toast = $("toast");
    toast.hidden = !text;
    toast.textContent = text || "";
  }

  function showOverlay(mode, title, text, action, extra) {
    const meta = extra || {};
    state.overlayMode = mode;
    $("overlay").hidden = false;
    $("overlay-title").textContent = title;
    $("overlay-text").textContent = text;
    $("overlay-action").textContent = action;
    $("overlay-action").hidden = !action;
    const metaEl = $("overlay-meta");
    const nowEl = $("overlay-now");
    if (meta.platform) {
      metaEl.hidden = false;
      metaEl.textContent = `Emisión en ${meta.platform}`;
    } else {
      metaEl.hidden = true;
      metaEl.textContent = "";
    }
    if (meta.now) {
      nowEl.hidden = false;
      nowEl.textContent = meta.now;
    } else {
      nowEl.hidden = true;
      nowEl.textContent = "";
    }
    const ch = current();
    $("overlay-logo").innerHTML = ch ? logoHtml(ch.name, ch.logo) : "";
  }

  function hideOverlay() {
    $("overlay").hidden = true;
  }

  function openExternal(ch) {
    const url = safeUrl(ch && ch.external);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function showExternal(ch) {
    stopPlayback();
    state.phase = "external";
    showToast("");
    $("onair").hidden = true;
    $("osd").hidden = true;
    $("play-btn").textContent = "Pausa";
    setSignal(ch.platform || "Externo");
    const pair = nowAndNext(ch.id);
    const now = pair.currentProg ? `Ahora · ${pair.currentProg[2]}` : "";
    const next = pair.nextProg ? `Después · ${pair.nextProg[2]}` : "";
    showOverlay(
      "external",
      ch.name,
      next
        ? `${next}. Este canal no emite HLS en abierto: se abre en ${ch.platform}.`
        : `Este canal no emite HLS en abierto. Ábrelo en ${ch.platform} para verlo con su señal oficial.`,
      `Abrir en ${ch.platform}`,
      { platform: ch.platform, now: now || (ch.group === "Generalistas" ? "Directo comercial" : ch.group) }
    );
    document.title = `${ch.name} · Mi Tele`;
    try { localStorage.setItem("mltv:last", String(ch.n)); } catch (err) { /* ignore */ }
  }

  function showOsd() {
    const ch = current();
    if (!ch || (state.phase !== "playing" && state.phase !== "external")) return;
    if (document.body.classList.contains("guide")) return;
    const pair = nowAndNext(ch.id);
    $("osd").hidden = false;
    $("osd-num").textContent = String(ch.n);
    $("osd-logo").innerHTML = logoHtml(ch.name, ch.logo);
    $("osd-name").textContent = ch.name;
    $("osd-now").textContent = pair.currentProg
      ? `Ahora · ${pair.currentProg[2]}`
      : (isExternalOnly(ch) ? (ch.platform || "Externo") : ch.group);
    $("osd-next").textContent = pair.nextProg ? `Después · ${pair.nextProg[2]}` : "";
    updateProgress();
    clearTimeout(state.osdTimer);
    state.osdTimer = setTimeout(() => { $("osd").hidden = true; }, 4200);
  }

  function updateProgress() {
    const ch = current();
    const bar = $("osd-bar");
    if (!ch) return;
    const pair = nowAndNext(ch.id);
    if (!pair.currentProg) {
      bar.style.width = "0%";
      return;
    }
    const [start, end] = pair.currentProg;
    const now = Date.now() / 1000;
    const pct = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
    bar.style.width = `${pct}%`;
  }

  function channelSubtitle(ch, pair) {
    if (pair && pair.currentProg) return pair.currentProg[2];
    if (isExternalOnly(ch)) return ch.platform || "Externo";
    if (ch.youtube && !(ch.urls && ch.urls.length)) return "YouTube";
    if (ch.region) return ch.region;
    return ch.group;
  }

  function renderChips() {
    const groups = sortGroups([...new Set(state.channels.map((ch) => ch.group))]);
    const items = ["Principales", "Todos", ...groups];
    $("chips").innerHTML = items.map((name) => (
      `<button type="button" data-filter="${esc(name)}" class="${name === state.filter ? "on" : ""}" aria-pressed="${name === state.filter}">${esc(name)}</button>`
    )).join("");
  }

  function renderList() {
    const rows = visibleChannels();
    $("list-count").textContent = rows.length === 1 ? "1 canal" : `${rows.length} canales`;
    if (!rows.length) {
      $("list").innerHTML = `<div class="empty-list">Ningún canal coincide con esa búsqueda.</div>`;
      return;
    }
    const now = Date.now() / 1000;
    const active = current() && current().n;
    $("list").innerHTML = rows.map((ch) => {
      const pair = nowAndNext(ch.id, now);
      const badge = isExternalOnly(ch) ? `<span class="badge-ext">Externo</span>` : "";
      const sub = channelSubtitle(ch, pair);
      return `<button type="button" class="ch${ch.n === active ? " on" : ""}" data-n="${ch.n}">
        <span class="ch-num">${ch.n}</span>
        ${logoHtml(ch.name, ch.logo)}
        <span><span class="ch-name">${esc(ch.name)}${badge}</span><span class="ch-sub">${esc(sub)}</span></span>
      </button>`;
    }).join("");
    const on = $("list").querySelector(".ch.on");
    if (on) on.scrollIntoView({ block: "nearest" });
  }

  function markActive() {
    const n = current() && current().n;
    $("list").querySelectorAll(".ch").forEach((el) => {
      el.classList.toggle("on", Number(el.dataset.n) === n);
    });
    const on = $("list").querySelector(".ch.on");
    if (on) on.scrollIntoView({ block: "nearest" });
  }

  function ensureVisible(ch) {
    if (visibleChannels().some((item) => item.n === ch.n)) return;
    state.filter = PRINCIPALES.has(ch.group) ? "Principales" : ch.group;
    state.query = "";
    $("search").value = "";
    renderChips();
    renderList();
  }

  function refreshNowLabels() {
    const now = Date.now() / 1000;
    $("list").querySelectorAll(".ch").forEach((el) => {
      const ch = state.channels.find((item) => item.n === Number(el.dataset.n));
      const sub = el.querySelector(".ch-sub");
      if (!ch || !sub) return;
      const pair = nowAndNext(ch.id, now);
      sub.textContent = channelSubtitle(ch, pair);
    });
    if (!$("osd").hidden) showOsd();
    if (document.body.classList.contains("guide")) positionNowLine();
  }

  function destroyHls() {
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }
  }

  function hideYoutube() {
    $("yt").hidden = true;
    $("yt").replaceChildren();
  }

  function isLocalFile() {
    return location.protocol === "file:" || location.origin === "null";
  }

  function youtubeLiveUrl(id) {
    return `https://www.youtube.com/channel/${encodeURIComponent(id)}/live`;
  }

  function openYoutube(id) {
    const channelId = id || state.youtubePending || (current() && current().youtube);
    if (!channelId) return;
    window.open(youtubeLiveUrl(channelId), "_blank", "noopener,noreferrer");
  }

  function showYoutubeGate(ch, id) {
    state.phase = "external";
    state.overlayMode = "youtube";
    state.youtubePending = id;
    showToast("");
    $("onair").hidden = true;
    $("osd").hidden = true;
    setSignal("YouTube");
    const pair = nowAndNext(ch.id);
    showOverlay(
      "youtube",
      ch.name,
      "YouTube no permite el reproductor embebido desde un archivo local (error 153). Ábrelo en YouTube para ver el directo.",
      "Abrir en YouTube",
      {
        platform: "YouTube",
        now: pair.currentProg ? `Ahora · ${pair.currentProg[2]}` : "Directo en YouTube"
      }
    );
    document.title = `${ch.name} · Mi Tele`;
    try { localStorage.setItem("mltv:last", String(ch.n)); } catch (err) { /* ignore */ }
  }

  function showYoutube(id) {
    if (!/^UC[\w-]{8,}$/.test(id)) return false;
    destroyHls();
    video.pause();
    video.removeAttribute("src");
    video.load();
    hideYoutube();

    // Desde file:// YouTube exige Referer HTTP y responde error 153.
    if (isLocalFile()) return "gate";

    const frame = document.createElement("iframe");
    const mute = video.muted ? "&mute=1" : "";
    const origin = encodeURIComponent(location.origin);
    frame.src = `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(id)}&autoplay=1&playsinline=1&rel=0&modestbranding=1&origin=${origin}${mute}`;
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";
    frame.allowFullscreen = true;
    frame.title = `Emisión de ${current().name} en YouTube`;
    $("yt").replaceChildren(frame);
    $("yt").hidden = false;
    return true;
  }

  function tryPlay(url, token) {
    return new Promise((resolve) => {
      destroyHls();
      hideYoutube();
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(token === state.playToken && ok);
      };
      const timer = setTimeout(() => finish(false), 9000);
      const onReady = () => {
        const played = video.play();
        if (played && typeof played.then === "function") {
          played.then(() => finish(true)).catch((err) => {
            if (err && err.name === "NotAllowedError") {
              showOverlay("gesture", current().name, "El navegador espera un toque para poner el sonido.", "Empezar");
              finish(true);
            } else finish(false);
          });
        } else finish(true);
      };

      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false,
          capLevelToPlayerSize: true,
          manifestLoadingTimeOut: 8000,
          manifestLoadingMaxRetry: 0,
          levelLoadingMaxRetry: 1,
          fragLoadingMaxRetry: 2
        });
        state.hls = hls;
        let recovered = false;
        hls.on(Hls.Events.MANIFEST_PARSED, onReady);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) {
            recovered = true;
            hls.recoverMediaError();
            return;
          }
          finish(false);
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        return;
      }

      const onMeta = () => onReady();
      const onErr = () => finish(false);
      video.addEventListener("loadedmetadata", onMeta, { once: true });
      video.addEventListener("error", onErr, { once: true });
      video.src = url;
    });
  }

  function parseOfficial(markdown) {
    const linkRe = /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
    const rows = [];
    markdown.split(/\r?\n/).forEach((line) => {
      if (!line.startsWith("|") || /^\|\s*-+/.test(line)) return;
      const cols = line.split("|").slice(1, -1).map((col) => col.trim());
      if (cols.length < 5 || /^canal$/i.test(cols[0])) return;
      const links = [...cols[1].matchAll(linkRe)].map((match) => match[2]);
      const urls = links.filter((url) => /\.m3u8(?:\?|#|$)/i.test(url));
      let youtube = null;
      links.some((url) => {
        const match = url.match(/youtube\.com\/channel\/(UC[\w-]{8,})/i);
        if (match) youtube = match[1];
        return Boolean(match);
      });
      const logos = [...(cols[3] || "").matchAll(linkRe)];
      rows.push({
        name: cols[0],
        id: (cols[4] || "").trim(),
        urls,
        youtube,
        logo: logos.length ? logos[0][2] : ""
      });
    });
    return rows;
  }

  function applyOfficial(rows) {
    const byName = new Map();
    const byId = new Map();
    rows.forEach((row) => {
      const key = norm(row.name);
      if (key && !byName.has(key)) byName.set(key, row);
      if (row.id) {
        if (!byId.has(row.id)) byId.set(row.id, []);
        byId.get(row.id).push(row);
      }
    });
    let refreshed = 0;
    state.channels.forEach((ch) => {
      const row = byName.get(norm(ch.name));
      const siblings = ch.id ? (byId.get(ch.id) || []) : [];
      const pool = [];
      [row, ...siblings].forEach((item) => {
        if (!item) return;
        item.urls.forEach((url) => {
          if (safeUrl(url) && !pool.includes(url)) pool.push(url);
        });
        if (!ch.youtube && item.youtube) ch.youtube = item.youtube;
        if (!ch.logo && item.logo) ch.logo = item.logo;
      });
      if (!pool.length) return;
      const merged = [];
      [...pool, ...ch.urls].forEach((url) => {
        if (!merged.includes(url)) merged.push(url);
      });
      if (merged[0] !== ch.urls[0]) refreshed += 1;
      ch.urls = merged;
    });
    try {
      localStorage.setItem("mltv:sources", JSON.stringify(state.channels.map((ch) => ({
        name: ch.name,
        urls: ch.urls,
        youtube: ch.youtube || null
      }))));
    } catch (err) { /* quota */ }
    return refreshed;
  }

  function officialData(force) {
    const fresh = state.officialRows && Date.now() - state.officialAt < 30 * 60 * 1000;
    if (!force && fresh) return Promise.resolve(state.officialRows);
    if (!force && state.officialTask) return state.officialTask;
    state.officialTask = fetch(OFFICIAL, { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then((markdown) => {
        state.officialRows = parseOfficial(markdown);
        state.officialAt = Date.now();
        const changed = applyOfficial(state.officialRows);
        setNote(changed
          ? "Lista contrastada. Atresmedia y Mediaset van como externos a su web oficial."
          : "Lista contrastada. Atresmedia y Mediaset van como externos a su web oficial.");
        return state.officialRows;
      })
      .catch(() => {
        state.officialTask = null;
        return null;
      });
    return state.officialTask;
  }

  async function tune(ch, options) {
    const opts = options || {};
    const token = ++state.playToken;
    state.phase = "loading";
    state.youtubePending = null;
    $("onair").hidden = true;
    hideOverlay();
    $("osd").hidden = true;
    if (isExternalOnly(ch)) {
      if (token !== state.playToken) return;
      showExternal(ch);
      return;
    }
    // Canales solo YouTube: no pasar por HLS ni por la lista oficial.
    if (ch.youtube && !(ch.urls && ch.urls.length)) {
      if (token !== state.playToken) return;
      const yt = showYoutube(ch.youtube);
      if (yt === "gate") {
        showYoutubeGate(ch, ch.youtube);
        return;
      }
      if (yt) return playing(ch, `youtube:${ch.youtube}`, false);
    }
    if (opts.rotate && ch.urls.length > 1) ch.urls.push(ch.urls.shift());
    const tried = new Set();
    const locals = ch.urls.slice();
    for (let i = 0; i < locals.length; i += 1) {
      if (token !== state.playToken) return;
      const url = locals[i];
      tried.add(url);
      showToast(i === 0
        ? `Sintonizando ${ch.name}…`
        : `Esa señal no responde. Probando otra de ${ch.name}…`);
      setSignal(i === 0 ? hostname(url) : `Sustituto · ${hostname(url)}`);
      if (await tryPlay(url, token)) return playing(ch, url, i > 0);
    }
    if (token !== state.playToken) return;
    showToast(`Buscando un sustituto actualizado de ${ch.name}…`);
    setSignal("Consultando la lista oficial");
    await officialData(Boolean(opts.force));
    if (token !== state.playToken) return;
    const extras = ch.urls.filter((url) => !tried.has(url));
    for (let i = 0; i < extras.length; i += 1) {
      if (token !== state.playToken) return;
      showToast(`Probando una señal nueva de ${ch.name}…`);
      setSignal(`Sustituto · ${hostname(extras[i])}`);
      tried.add(extras[i]);
      if (await tryPlay(extras[i], token)) return playing(ch, extras[i], true);
    }
    if (token !== state.playToken) return;
    if (ch.youtube) {
      const yt = showYoutube(ch.youtube);
      if (yt === "gate") {
        showYoutubeGate(ch, ch.youtube);
        return;
      }
      if (yt) return playing(ch, `youtube:${ch.youtube}`, true);
    }
    if (token !== state.playToken) return;
    if (ch.external) {
      showExternal(ch);
      return;
    }
    state.phase = "error";
    showToast("");
    setSignal("Sin señal");
    showOverlay(
      "error",
      ch.name,
      "No queda ninguna señal en abierto funcionando para este canal.",
      "Volver a intentar"
    );
  }

  function playing(ch, url, alt) {
    if (state.playToken === 0) return;
    state.phase = "playing";
    showToast("");
    hideOverlay();
    $("onair").hidden = false;
    $("play-btn").textContent = "Pausa";
    if (String(url).startsWith("youtube:")) setSignal(alt ? "YouTube · sustituto" : "YouTube");
    else setSignal(alt ? `Sustituto · ${hostname(url)}` : hostname(url));
    document.title = `${ch.name} · Mi Tele`;
    showOsd();
    try { localStorage.setItem("mltv:last", String(ch.n)); } catch (err) { /* ignore */ }
  }

  function playChannel(index) {
    const ch = state.channels[index];
    if (!ch) return;
    state.current = index;
    ensureVisible(ch);
    markActive();
    document.title = `${ch.name} · Mi Tele`;
    tune(ch);
  }

  function playNumber(n) {
    const index = state.channels.findIndex((ch) => ch.n === n);
    if (index < 0) {
      showToast(`No hay canal ${n}`);
      setTimeout(() => { if (state.phase === "playing") showToast(""); }, 1600);
      return;
    }
    playChannel(index);
  }

  function zap(delta) {
    const rows = visibleChannels();
    if (!rows.length) return;
    const ch = current();
    let index = rows.findIndex((item) => item.n === (ch && ch.n));
    if (index < 0) index = 0;
    else index = (index + delta + rows.length) % rows.length;
    const next = state.channels.findIndex((item) => item.n === rows[index].n);
    playChannel(next);
  }

  function showIdle() {
    const ch = current();
    state.phase = "idle";
    showOverlay("idle", ch ? ch.name : "Mi Tele", "Elige un canal de la lista o dale al botón para empezar.", ch ? `Ver ${ch.name}` : "Ver");
    setSignal("Listo");
  }

  function togglePlay() {
    if ($("yt").querySelector("iframe")) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function tickClock() {
    const now = new Date();
    $("clock-time").textContent = new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Madrid"
    }).format(now);
    $("clock-date").textContent = new Intl.DateTimeFormat("es-ES", {
      weekday: "long", day: "numeric", month: "short", timeZone: "Europe/Madrid"
    }).format(now);
    if (state.phase === "playing") updateProgress();
  }

  function guideDays() {
    let min = Infinity;
    let max = 0;
    Object.values(state.epg).forEach((rows) => {
      rows.forEach((item) => {
        if (item[0] < min) min = item[0];
        if (item[1] > max) max = item[1];
      });
    });
    if (!Number.isFinite(min)) return [];
    const keys = [];
    let key = madridKey(min * 1000);
    const end = madridKey((max - 60) * 1000);
    while (key <= end && keys.length < 8) {
      keys.push(key);
      key = addDays(key, 1);
    }
    return keys;
  }

  function dayLabel(key) {
    const today = madridKey(Date.now());
    if (key === today) return "Hoy";
    if (key === addDays(today, 1)) return "Mañana";
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short", day: "numeric", timeZone: "Europe/Madrid"
    }).format(new Date(madridMidnightMs(key)));
  }

  function guideStamp() {
    if (!state.epgUpdated) return "Sin guía";
    const when = new Intl.DateTimeFormat("es-ES", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      hourCycle: "h23", timeZone: "Europe/Madrid"
    }).format(new Date(state.epgUpdated * 1000));
    return state.epgLive ? `Guía actualizada · ${when}` : `Guía guardada · ${when}`;
  }

  function renderGuide() {
    const days = guideDays();
    const today = madridKey(Date.now());
    if (!state.guideDay || !days.includes(state.guideDay)) {
      state.guideDay = days.includes(today) ? today : (days[0] || today);
    }
    $("days").innerHTML = days.map((key) => (
      `<button type="button" data-day="${key}" class="${key === state.guideDay ? "on" : ""}">${esc(dayLabel(key))}</button>`
    )).join("");
    $("guide-meta").textContent = guideStamp();

    const start = madridMidnightMs(state.guideDay) / 1000;
    const end = start + 86400;
    const width = 24 * HOUR;
    const rows = visibleChannels();
    state.guideMap = new Map();
    const canvas = $("guide-canvas");
    if (!rows.length) {
      canvas.innerHTML = `<div class="empty-list">No hay canales en esta vista.</div>`;
      return;
    }

    const ticks = [];
    for (let hour = 0; hour < 24; hour += 1) {
      ticks.push(`<span class="tick" style="left:${hour * HOUR}px">${String(hour).padStart(2, "0")}:00</span>`);
    }
    const head = `<div class="g-row g-head"><div class="g-ch">Canal</div><div class="g-track" style="width:${width}px">${ticks.join("")}</div></div>`;
    const body = rows.map((ch) => {
      const items = programmes(ch.id).filter((item) => item[1] > start && item[0] < end);
      state.guideMap.set(ch.n, items);
      const blocks = items.map((item, index) => {
        const left = Math.max(0, (item[0] - start) / 3600) * HOUR;
        const right = Math.min(24, (item[1] - start) / 3600) * HOUR;
        const box = Math.max(right - left, 8);
        const now = Date.now() / 1000;
        const isNow = item[0] <= now && now < item[1];
        const narrow = box < 86;
        return `<button type="button" class="prog${isNow ? " is-now" : ""}" style="left:${left}px;width:${box}px" data-n="${ch.n}" data-i="${index}" title="${esc(item[2])}">
          <strong>${esc(item[2])}</strong>
          ${narrow ? "" : `<em>${formatHM(item[0])}–${formatHM(item[1])}</em>`}
        </button>`;
      }).join("");
      const empty = blocks ? "" : `<span class="tick" style="left:12px;transform:none">Sin datos de programación</span>`;
      return `<div class="g-row"><button type="button" class="g-ch" data-tune="${ch.n}">${logoHtml(ch.name, ch.logo)}<b>${esc(ch.name)}</b></button><div class="g-track" style="width:${width}px">${blocks}${empty}</div></div>`;
    }).join("");
    canvas.innerHTML = `${head}${body}<div class="now-line" id="now-line" hidden></div>`;
    positionNowLine();
    if (state.guideDay === madridKey(Date.now())) {
      requestAnimationFrame(() => scrollGuideToNow());
    }
  }

  function positionNowLine() {
    const line = $("now-line");
    if (!line || !state.guideDay) return;
    if (state.guideDay !== madridKey(Date.now())) {
      line.hidden = true;
      return;
    }
    const start = madridMidnightMs(state.guideDay) / 1000;
    const x = 228 + ((Date.now() / 1000 - start) / 3600) * HOUR;
    line.hidden = false;
    line.style.left = `${x}px`;
  }

  function scrollGuideToNow() {
    const sc = $("guide-scroll");
    const line = $("now-line");
    if (!sc || !line || line.hidden || state.guideDay !== madridKey(Date.now())) return;
    const left = parseFloat(line.style.left) || 0;
    const gutter = Math.min(460, Math.max(240, sc.clientWidth * 0.28));
    const next = Math.max(0, left - gutter);
    sc.scrollLeft = next;
    requestAnimationFrame(() => { sc.scrollLeft = next; });
  }

  function openDetail(ch, item) {
    state.picked = { n: ch.n, item };
    $("detail").hidden = false;
    $("detail-when").textContent = `${ch.name} · ${formatHM(item[0])} – ${formatHM(item[1])}`;
    $("detail-title").textContent = item[2];
    $("detail-desc").textContent = item[3] || "Sin descripción.";
    document.querySelectorAll(".prog").forEach((el) => el.classList.remove("is-picked"));
    const picked = document.querySelector(`.prog[data-n="${ch.n}"].is-now`) || null;
    document.querySelectorAll(`.prog[data-n="${ch.n}"]`).forEach((el) => {
      const prog = (state.guideMap.get(ch.n) || [])[Number(el.dataset.i)];
      if (prog && prog[0] === item[0]) el.classList.add("is-picked");
    });
    if (picked) picked.classList.add("is-picked");
  }

  function setView(view) {
    const guide = view === "guide";
    document.body.classList.toggle("guide", guide);
    $("view-guide").hidden = !guide;
    $("tab-guide").classList.toggle("on", guide);
    $("tab-tv").classList.toggle("on", !guide);
    if (!guide) {
      $("detail").hidden = true;
      return;
    }
    renderGuide();
    requestAnimationFrame(scrollGuideToNow);
  }

  function compactEpg(data) {
    const epg = {};
    data.forEach((ch) => {
      const rows = [];
      (ch.events || []).forEach((event) => {
        const title = String(event.t || "").trim();
        if (!title) return;
        let desc = String(event.d || "").replace(/\s+/g, " ").trim();
        if (desc.length > 180) desc = `${desc.slice(0, 177).trim()}…`;
        rows.push([Number(event.hi), Number(event.hf), title, desc]);
      });
      if (rows.length) epg[ch.name] = rows;
    });
    return epg;
  }

  function idb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("mltv", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("kv");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function idbGet(key) {
    return idb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    })).catch(() => null);
  }

  function idbSet(key, value) {
    return idb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    })).catch(() => {});
  }

  function useEpg(epg, updated, live) {
    state.epg = epg;
    state.epgUpdated = updated;
    state.epgLive = live;
    refreshNowLabels();
    if (document.body.classList.contains("guide")) renderGuide();
    else $("guide-meta").textContent = guideStamp();
  }

  async function hydrateEpg() {
    const cached = await idbGet("epg");
    if (cached && cached.epg && cached.updated > state.epgUpdated) {
      useEpg(cached.epg, cached.updated, true);
    }
    const button = $("guide-refresh");
    button.disabled = true;
    try {
      const res = await fetch(EPG_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const epg = compactEpg(data);
      const updated = Math.floor(Date.now() / 1000);
      useEpg(epg, updated, true);
      await idbSet("epg", { updated, epg });
    } catch (err) {
      $("guide-meta").textContent = guideStamp();
    } finally {
      button.disabled = false;
    }
  }

  function loadStoredSources() {
    try {
      const saved = JSON.parse(localStorage.getItem("mltv:sources") || "[]");
      const map = new Map(saved.map((row) => [row.name, row]));
      state.channels.forEach((ch) => {
        const row = map.get(ch.name);
        if (!row || !Array.isArray(row.urls)) return;
        const urls = row.urls.filter((url) => safeUrl(url));
        if (urls.length) ch.urls = urls;
        if (row.youtube) ch.youtube = row.youtube;
      });
    } catch (err) { /* ignore */ }
  }

  function pushDigit(digit) {
    state.digits = (state.digits + digit).slice(-3);
    $("numflash").hidden = false;
    $("numflash").textContent = state.digits;
    clearTimeout(state.digitTimer);
    state.digitTimer = setTimeout(() => {
      const n = parseInt(state.digits, 10);
      state.digits = "";
      $("numflash").hidden = true;
      if (n) playNumber(n);
    }, 900);
  }

  function bind() {
    $("chips").addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      state.filter = button.dataset.filter;
      renderChips();
      renderList();
      if (document.body.classList.contains("guide")) renderGuide();
    });

    $("search").addEventListener("input", () => {
      state.query = $("search").value;
      renderList();
      if (document.body.classList.contains("guide")) renderGuide();
    });

    $("list").addEventListener("click", (event) => {
      const button = event.target.closest("[data-n]");
      if (!button) return;
      const index = state.channels.findIndex((ch) => ch.n === Number(button.dataset.n));
      if (index >= 0) playChannel(index);
    });

    $("list").addEventListener("error", (event) => {
      if (event.target.tagName === "IMG") event.target.remove();
    }, true);

    $("ch-prev").addEventListener("click", () => zap(-1));
    $("ch-next").addEventListener("click", () => zap(1));
    $("play-btn").addEventListener("click", togglePlay);
    $("mute-btn").addEventListener("click", () => {
      video.muted = !video.muted;
      $("mute-btn").textContent = video.muted ? "Sonido" : "Silencio";
      try { localStorage.setItem("mltv:muted", video.muted ? "1" : "0"); } catch (err) { /* ignore */ }
    });
    $("volume").addEventListener("input", () => {
      video.volume = Number($("volume").value);
      if (video.volume > 0 && video.muted) {
        video.muted = false;
        $("mute-btn").textContent = "Silencio";
      }
      try { localStorage.setItem("mltv:volume", String(video.volume)); } catch (err) { /* ignore */ }
    });
    $("full-btn").addEventListener("click", () => {
      const node = $("bezel");
      if (document.fullscreenElement) document.exitFullscreen();
      else node.requestFullscreen().catch(() => {});
    });
    $("overlay-action").addEventListener("click", () => {
      if (state.overlayMode === "youtube") openYoutube();
      else if (state.overlayMode === "external") openExternal(current());
      else if (state.overlayMode === "error") tune(current(), { rotate: true, force: true });
      else if (state.overlayMode === "gesture") video.play().then(hideOverlay).catch(() => {});
      else playChannel(state.current);
    });
    $("tab-tv").addEventListener("click", () => setView("tv"));
    $("tab-guide").addEventListener("click", () => setView("guide"));
    $("guide-now").addEventListener("click", () => {
      state.guideDay = madridKey(Date.now());
      renderGuide();
      requestAnimationFrame(scrollGuideToNow);
    });
    $("guide-refresh").addEventListener("click", hydrateEpg);
    $("days").addEventListener("click", (event) => {
      const button = event.target.closest("[data-day]");
      if (!button) return;
      state.guideDay = button.dataset.day;
      renderGuide();
    });
    $("guide-canvas").addEventListener("click", (event) => {
      const tuneBtn = event.target.closest("[data-tune]");
      if (tuneBtn) {
        const index = state.channels.findIndex((ch) => ch.n === Number(tuneBtn.dataset.tune));
        if (index >= 0) {
          setView("tv");
          playChannel(index);
        }
        return;
      }
      const prog = event.target.closest(".prog");
      if (!prog) return;
      const ch = state.channels.find((item) => item.n === Number(prog.dataset.n));
      const item = (state.guideMap.get(ch.n) || [])[Number(prog.dataset.i)];
      if (ch && item) openDetail(ch, item);
    });
    $("guide-canvas").addEventListener("error", (event) => {
      if (event.target.tagName === "IMG") event.target.remove();
    }, true);
    $("detail-tune").addEventListener("click", () => {
      if (!state.picked) return;
      const index = state.channels.findIndex((ch) => ch.n === state.picked.n);
      $("detail").hidden = true;
      setView("tv");
      if (index >= 0) playChannel(index);
    });
    $("bezel").addEventListener("click", () => {
      if (document.body.classList.contains("guide")) setView("tv");
    });
    video.addEventListener("click", (event) => {
      if (document.body.classList.contains("guide")) return;
      event.stopPropagation();
      if (state.phase === "playing") togglePlay();
    });
    video.addEventListener("play", () => { $("play-btn").textContent = "Pausa"; });
    video.addEventListener("pause", () => { $("play-btn").textContent = "Seguir"; });
    $("screen").addEventListener("error", (event) => {
      if (event.target.tagName === "IMG") event.target.remove();
    }, true);
    $("screen").addEventListener("mousemove", () => {
      if (state.phase === "playing") showOsd();
    });
    $("screen").addEventListener("wheel", (event) => {
      if (document.body.classList.contains("guide")) return;
      event.preventDefault();
      const now = Date.now();
      if (now - state.lastWheel < 450) return;
      state.lastWheel = now;
      zap(event.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
      const typing = event.target.matches("input, textarea");
      if (typing) {
        if (event.key === "Escape") event.target.blur();
        return;
      }
      if (event.key === "ArrowUp") { event.preventDefault(); zap(-1); }
      else if (event.key === "ArrowDown") { event.preventDefault(); zap(1); }
      else if (event.key === "ArrowLeft" && document.body.classList.contains("guide")) {
        $("guide-scroll").scrollLeft -= HOUR / 2;
      } else if (event.key === "ArrowRight" && document.body.classList.contains("guide")) {
        $("guide-scroll").scrollLeft += HOUR / 2;
      } else if (event.key === "ArrowLeft") {
        video.volume = Math.max(0, video.volume - 0.05);
        $("volume").value = String(video.volume);
      } else if (event.key === "ArrowRight") {
        video.volume = Math.min(1, video.volume + 0.05);
        $("volume").value = String(video.volume);
      } else if (event.key === " " || event.key === "k") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "m") $("mute-btn").click();
      else if (event.key === "f") $("full-btn").click();
      else if (event.key === "g" || event.key === "G") {
        setView(document.body.classList.contains("guide") ? "tv" : "guide");
      } else if (event.key === "Escape") {
        if (!$("detail").hidden) $("detail").hidden = true;
        else if (document.body.classList.contains("guide")) setView("tv");
        else if (document.fullscreenElement) document.exitFullscreen();
      } else if (/^[0-9]$/.test(event.key)) pushDigit(event.key);
    });
  }

  function init() {
    const base = (window.MLTV_CHANNELS || []).map((ch) => ({ ...ch, urls: ch.urls.slice(), youtube: null }));
    state.channels = mergeChannels(base);
    state.epg = window.MLTV_EPG || {};
    state.epgUpdated = window.MLTV_EPG_UPDATED || 0;
    loadStoredSources();
    try {
      const rawVolume = localStorage.getItem("mltv:volume");
      const savedVolume = rawVolume == null ? NaN : Number(rawVolume);
      if (Number.isFinite(savedVolume)) {
        video.volume = savedVolume;
        $("volume").value = String(savedVolume);
      } else video.volume = 0.9;
      video.muted = localStorage.getItem("mltv:muted") === "1";
      if (video.muted) $("mute-btn").textContent = "Sonido";
    } catch (err) { video.volume = 0.9; }

    const last = Number(localStorage.getItem("mltv:last"));
    const index = state.channels.findIndex((ch) => ch.n === last);
    state.current = index >= 0 ? index : 0;
    bind();
    renderChips();
    renderList();
    showIdle();
    tickClock();
    setInterval(tickClock, 1000);
    setInterval(refreshNowLabels, 30000);
    document.querySelectorAll("img").forEach((img) => {
      img.addEventListener("error", () => img.remove());
    });
    setNote("Incluye Atresmedia y Mediaset como externos (Atresplayer / mitele).");
    officialData(false);
    hydrateEpg();
  }

  init();
})();
