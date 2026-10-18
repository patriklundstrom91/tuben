import { useCallback, useEffect, useState } from 'react';
import { ArrowDownUp, ArrowRight, ArrowUpRight, ChevronDown, Clock3, CloudRain, CloudSun, LocateFixed, MapPin, Menu, MoveUpRight, Navigation, Search, Sunset, TrainFront, Wind, Sun } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const api = (path: string) => fetch(`${API_BASE}${path}`);

function isWeatherForecast(value: any) {
  return value && value.source === 'SMHI' && typeof value.forecastUpdatedAt === 'string' && Number.isFinite(value.current?.temperatureC) && typeof value.current?.condition === 'string' && Array.isArray(value.nextHours);
}

function formatWeatherUpdate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Stockholm' }).format(date);
}

function formatDepartureLabel(departure: any) {
  const value = departure.display || '—';
  if (departure.duration) return value;
  if (/^\d+\s*min$/i.test(value)) return value;
  if (value.toLocaleLowerCase('sv-SE') === 'nu') return 'Nu';
  return value;
}

function lineNumber(line: any) {
  const label = String(line?.designation || line?.name || line?.id || 'T');
  return label.match(/\d{1,2}/)?.[0] || 'T';
}

function lineColor(line: any) {
  const number = lineNumber(line);
  const group = String(line?.group_of_lines || line?.name || '').toLocaleLowerCase('sv-SE');
  if (group.includes('röd') || ['13', '14'].includes(number)) return '#e32017';
  if (group.includes('blå') || ['10', '11'].includes(number)) return '#0077c8';
  if (group.includes('grön') || ['17', '18', '19'].includes(number)) return '#009b5a';
  return '#68756b';
}

function lineGroupLabel(line: any) {
  const group = String(line?.group_of_lines || line?.name || '').toLocaleLowerCase('sv-SE');
  if (group.includes('grön')) return 'Gröna linjen';
  if (group.includes('röd')) return 'Röda linjen';
  if (group.includes('blå')) return 'Blå linjen';
  return '';
}

function App() {
  const [mode, setMode] = useState<'smart' | 'board'>('smart');
  const [dest, setDest] = useState('');
  const [activeDestination, setActiveDestination] = useState('');
  const [direction, setDirection] = useState('');
  const [location, setLocation] = useState('Hammarbyhöjden, Stockholm');
  const [resolvedLocation, setResolvedLocation] = useState('');
  const [originCoordinates, setOriginCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nearby, setNearby] = useState<any[]>([]);
  const [departures, setDepartures] = useState<Record<number, any[]>>({});
  const [stationLines, setStationLines] = useState<Record<number, any[]>>({});
  const [weather, setWeather] = useState<any>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const searchNearby = useCallback(async (lat: number, lon: number) => {
    const [weatherResult, stationResult] = await Promise.all([
      api(`/api/weather?lat=${lat}&lon=${lon}`).catch(() => null),
      api(`/api/stations/nearby?lat=${lat}&lon=${lon}&limit=2`)
    ]);
    if (weatherResult?.ok) {
      const forecast = await weatherResult.json();
      setWeather(isWeatherForecast(forecast) ? forecast : null);
    } else setWeather(null);
    if (!stationResult.ok) throw new Error('Kunde inte hämta närmaste stationer från SL.');
    const stations = await stationResult.json();
    setNearby(stations);
    setDepartures({});
    setStationLines({});
    setError(stations.length ? '' : 'Hittade inga tunnelbanestationer nära den här platsen.');
  }, []);

  const locate = useCallback(async (useDevicePosition = false, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      if (useDevicePosition) {
        if (!navigator.geolocation) throw new Error('Webbläsaren stöder inte platsdelning.');
        const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000 }));
        setLocation('Din position');
        setResolvedLocation('Din position');
        setOriginCoordinates({ lat: position.coords.latitude, lon: position.coords.longitude });
        await searchNearby(position.coords.latitude, position.coords.longitude);
      } else {
        if (!location.trim()) throw new Error('Skriv in en plats eller adress.');
        const response = await api(`/api/geocode?q=${encodeURIComponent(location)}`);
        if (!response.ok) throw new Error('Platsen hittades inte. Prova en adress eller ett stationsnamn.');
        const place = await response.json();
        const placeLabel = place.name?.split(',').slice(0, 2).join(',') || location;
        setLocation(placeLabel);
        setResolvedLocation(placeLabel);
        setOriginCoordinates({ lat: place.lat, lon: place.lon });
        await searchNearby(place.lat, place.lon);
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Det gick inte att hämta stationer.';
      setError(message);
      if (!silent) alert(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [location, searchNearby]);

  useEffect(() => { void locate(false, true); }, []); // Initial view uses the editable default place.

  const refreshDepartures = useCallback(async (stations: any[], destination: string) => {
    if (!stations.length) return;
    setRefreshing(true);
    try {
      const entries = await Promise.all(stations.map(async station => {
        const boardPromise = api(`/api/stations/${station.id}/departures`)
          .then(async response => response.ok ? response.json() : [])
          .catch(() => []);
        if (destination.trim()) {
          const [response, stationBoard] = await Promise.all([
            api(`/api/trips?lat=${station.lat}&lon=${station.lon}&originStation=${encodeURIComponent(station.name)}&destination=${encodeURIComponent(destination.trim())}`),
            boardPromise
          ]);
          if (!response.ok) return { id: station.id, rows: [], lines: stationBoard };
          const body = await response.json();
          const journeys = body.journeys || body.Journeys || [];
          const rows = journeys.map((journey: any) => {
            const legs = journey.legs || journey.Legs || [];
            // SL puts departureTimeEstimated on the leg itself. The first leg
            // can be a walk, so prefer the metro leg when one is present.
            const leg = legs.find((candidate: any) => (candidate.productClasses || candidate.ProductClasses || []).includes(2))
              || legs.find((candidate: any) => candidate.departureTimeEstimated || candidate.departureTimePlanned || candidate.DepartureTimeEstimated || candidate.DepartureTimePlanned)
              || legs[0];
            const origin = leg?.origin || leg?.Origin;
            const transportation = leg?.transportation || leg?.Transportation;
            const transportationName = transportation?.name || transportation?.number || '';
            const designation = String(transportation?.number || transportation?.id || '').match(/\d{1,2}\s*$/)?.[0]?.trim() || '';
            const expected = leg?.departureTimeEstimated || leg?.departureTimePlanned || leg?.DepartureTimeEstimated || leg?.DepartureTimePlanned
              || origin?.departureTimeEstimated || origin?.departureTimePlanned || origin?.DepartureTimeEstimated || origin?.DepartureTimePlanned;
            const durationSeconds = journey.tripRtDuration || journey.tripDuration || journey.TripRtDuration || journey.TripDuration || 0;
            return { direction: destination.trim(), destination: destination.trim(), expected, display: expected ? new Date(expected).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : '—', duration: durationSeconds ? Math.round(durationSeconds / 60) : undefined, line: { designation, name: transportationName, group_of_lines: transportationName } };
          }).filter((row: any) => row.expected && new Date(row.expected).getTime() >= Date.now());
          return { id: station.id, rows, lines: stationBoard };
        }
        const stationBoard = await boardPromise;
        return { id: station.id, rows: stationBoard, lines: stationBoard };
      }));
      setDepartures(Object.fromEntries(entries.map(entry => [entry.id, entry.rows])));
      setStationLines(Object.fromEntries(entries.map(entry => [entry.id, entry.lines])));
      setLastUpdated(new Date());
    } catch {
      setError('Avgångarna kunde inte hämtas just nu. Försöker igen om en minut.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const submitSearch = async () => {
    // Destination edits reuse the resolved origin coordinates instead of
    // sending the destination through the place geocoder.
    if (originCoordinates && location.trim() === resolvedLocation.trim()) {
      setActiveDestination(dest.trim());
      if (nearby.length) {
        if (activeDestination.trim() === dest.trim()) void refreshDepartures(nearby, dest);
      } else {
        setLoading(true);
        try { await searchNearby(originCoordinates.lat, originCoordinates.lon); }
        catch (cause) { setError(cause instanceof Error ? cause.message : 'Stationerna kunde inte hämtas.'); }
        finally { setLoading(false); }
      }
      return;
    }
    setActiveDestination(dest.trim());
    void locate();
  };

  useEffect(() => {
    if (!nearby.length) return;
    let active = true;
    const update = () => { if (active) void refreshDepartures(nearby, activeDestination); };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [nearby, activeDestination, refreshDepartures]);

  const filteredDepartures = (station: any) => (departures[station.id] || []).filter((departure: any) => !direction || String(departure.direction || '').trim().toLocaleLowerCase('sv-SE') === direction.trim().toLocaleLowerCase('sv-SE'));
  const directionOptions = [...new Map(Object.values(departures)
    .flat()
    .map((departure: any) => String(departure.direction || '').trim())
    .filter(Boolean)
    .map(value => [value.toLocaleLowerCase('sv-SE'), value])).values()]
    .sort((a, b) => a.localeCompare(b, 'sv-SE'));

  useEffect(() => {
    if (direction && directionOptions.length && !directionOptions.some(option => option.toLocaleLowerCase('sv-SE') === direction.toLocaleLowerCase('sv-SE'))) setDirection('');
  }, [direction, directionOptions.join('|')]);

  return <div className="shell"><aside className="rail"><div className="brand-mark"><TrainFront size={22}/></div><div className="rail-spacer"/><button className="rail-btn active"><Navigation size={18}/></button><button className="rail-btn"><MapPin size={18}/></button><div className="rail-spacer"/><div className="avatar">A</div></aside><main className="main"><header className="topbar"><div className="wordmark"><span className="wordmark-icon"><TrainFront size={17}/></span>tuben<span className="wordmark-dot">.</span></div><div className="top-right"><span className="service"><i/>{refreshing ? 'Uppdaterar SL-data' : 'SL · Realtidsavgångar'}</span><button className="icon-button"><Menu size={18}/></button><div className="avatar small">A</div></div></header><div className="content"><div className="eyebrow"><span>DIN STAD, I RÖRELSE</span><span className="eyeline"/></div><section className="hero"><div><h1>Ut genom dörren.<br/><em>In i stan.</em></h1><p className="hero-copy">Avgångar från dina närmaste stationer, precis när du behöver dem.</p></div><div className="hero-art"><div className="sun-disc"/><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-station"><div className="art-pole"/><div className="art-sign">T</div><div className="art-base"/></div><div className="art-label">STOCKHOLM · 59°19′N</div></div></section>
  <section className="search-card"><div className="card-top"><div><div className="section-kicker">01 <span>STARTA HÄR</span></div><h2>Vart är du på väg?</h2></div>{nearby.length ? <span className="live-pill"><i/>SL · LIVE</span> : <span className="live-pill">ANSLUTER TILL SL</span>}</div><div className="input-row"><label className="location-input"><MapPin size={17}/><input value={location} onChange={e => setLocation(e.target.value)} aria-label="Din plats"/><button onClick={() => void locate(true)} title="Använd min plats"><LocateFixed size={17}/></button></label><div className="swap"><ArrowDownUp size={16}/></div><label className="destination-input"><Search size={17}/><input placeholder="Välj destination (valfritt)" value={dest} onChange={e => setDest(e.target.value)} aria-label="Destination"/><ChevronDown size={16}/></label><button className="go-button" onClick={submitSearch}>{loading ? 'Söker…' : 'Visa resan'}<ArrowUpRight size={17}/></button></div><div className="search-hint"><button className="location-action" onClick={() => void locate(true)}><LocateFixed size={13}/> Använd min position</button><span>ELLER</span><span>Skriv en plats eller adress</span><button onClick={() => void locate()}>Hitta stationer nära mig <ArrowRight size={14}/></button></div></section>
  <div className="section-heading"><div><div className="section-kicker">02 <span>NÄRA DIG</span></div><h2>{activeDestination ? 'Bästa avgångarna till ' + activeDestination : 'Dina närmaste stationer'}</h2></div><div className="section-controls"><select aria-label="Välj riktning" value={direction} onChange={e => setDirection(e.target.value)}><option value="">Alla riktningar</option>{directionOptions.map(option => <option key={option} value={option}>Mot {option}</option>)}</select><div className="mode-toggle"><button className={mode === 'smart' ? 'selected' : ''} onClick={() => setMode('smart')}>Smart resa</button><button className={mode === 'board' ? 'selected' : ''} onClick={() => setMode('board')}>Avgångstavla</button></div></div></div>
  {error && <p className="departure-notice">{error}</p>}
  {mode === 'smart' ? <div className="station-grid">{nearby.map((station: any, index: number) => {
    const live = filteredDepartures(station);
    const stationLineList = [...new Map((stationLines[station.id] || []).filter((departure: any) => departure.line).map((departure: any) => [lineNumber(departure.line), departure.line])).values()]
      .sort((a: any, b: any) => Number(lineNumber(a)) - Number(lineNumber(b)));
    const stationLineGroups = [...new Set(stationLineList.map(lineGroupLabel).filter(Boolean))];
    return <article className="station-card" key={station.id}><div className="station-top"><div className="station-label"><span className="station-index">0{index + 1}</span><div><h3>{station.name}</h3><span className="walk"><MapPin size={12}/>{station.distance != null ? `${Math.round(station.distance * 1000)} m från dig` : 'Nära dig'}</span></div></div><button className="more" aria-label={`Avgångar från ${station.name}`}><ArrowUpRight size={17}/></button></div><div className="route station-route"><div className="station-lines">{stationLineList.map((line: any) => <span className="line-dot" style={{ backgroundColor: lineColor(line) }} key={lineNumber(line)}>{lineNumber(line)}</span>)}</div><span className="station-line-groups">{stationLineGroups.join(' · ') || 'Tunnelbanan'}</span></div><div className="departures">{live.length ? live.slice(0, 4).map((departure: any, i: number) => <div className="departure" key={`${departure.journey?.id || departure.expected || departure.scheduled}-${i}`}><span className="dep-time">{formatDepartureLabel(departure)}</span><span className="line-dot departure-line" style={{ backgroundColor: lineColor(departure.line) }}>{lineNumber(departure.line)}</span><span className="dep-dest">{departure.destination || departure.direction || 'Tunnelbana'}</span><span className="dep-min">{departure.state === 'DEVIATED' ? 'ÄNDRAD' : departure.state === 'CANCELLED' ? 'INSTÄLLD' : departure.duration ? `RESTID ${departure.duration} MIN` : departure.journey?.prediction_state === 'NORMAL' ? 'I TID' : 'AVGÅNG'}</span></div>) : <div className="departure empty-departure">{refreshing ? 'Hämtar aktuella avgångar från SL…' : 'Inga kommande tunnelbaneavgångar hittades.'}</div>}</div><div className="card-foot"><span><Clock3 size={13}/>{lastUpdated ? `SL · uppdaterad ${lastUpdated.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}` : 'SL · inväntar data'}</span><button onClick={() => setMode('board')}>Visa hela tavlan <ArrowRight size={14}/></button></div></article>;
  })}</div> : <div className="board-panel"><div className="board-title"><div><h3>Avgångstavla</h3><span>{lastUpdated ? `Uppdaterad ${lastUpdated.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}` : 'Aktuella SL-avgångar'}</span></div></div>{nearby.map((station: any, i: number) => <div className="board-row" key={station.id}><div className="board-station">0{i + 1}　{station.name}</div><div className="board-deps">{filteredDepartures(station).slice(0, 4).map((departure: any, j: number) => <span key={`${departure.expected || departure.scheduled}-${j}`}><b>{formatDepartureLabel(departure)}</b>　<strong>{departure.destination || departure.direction}</strong> <MoveUpRight size={13}/></span>)}</div></div>)}{!nearby.length && <div className="empty-board">Avgångstavlan visas när stationer har hämtats från SL.</div>}</div>}
  <section className="weather-card"><div className="weather-copy"><div className="section-kicker">03 <span>UTANFÖR FÖNSTRET</span></div><h2>Ta med rätt känsla.</h2><p>Väderdata hämtas och bearbetas från SMHI</p>{weather ? <span className="coming"><i/>SMHI · PROGNOS</span> : <span className="coming">Väder ej tillgängligt</span>}</div><div className="weather-visual"><div className="weather-sun">{weather?.current?.symbolCode >= 8 ? <CloudRain size={32}/> : weather?.current?.symbolCode >= 5 ? <CloudSun size={32}/> : <Sun size={32}/>}</div><div className="weather-temp">{weather?.current?.temperatureC == null ? '—' : Math.round(weather.current.temperatureC)}<span>°</span></div><div className="weather-caption">{weather?.current?.condition?.toLocaleUpperCase('sv-SE') || '—'}</div><div className="weather-divider"/><div className="forecast"><span><Sunset size={15}/> Ikväll <b>{weather?.eveningLow?.temperatureC == null ? '—' : `${Math.round(weather.eveningLow.temperatureC)}°`}</b></span><span><CloudRain size={15}/> Regn <b>{weather?.rainProbabilityNext6HoursPct == null ? '—' : `${Math.round(weather.rainProbabilityNext6HoursPct)}%`}</b></span><span><Wind size={15}/> Vind <b>{weather?.current?.windSpeedMs == null ? '—' : `${Math.round(weather.current.windSpeedMs * 10) / 10} m/s`}</b></span></div>{weather && <div className="weather-updated"><Clock3 size={13}/> Prognos uppdaterad {formatWeatherUpdate(weather.forecastUpdatedAt)}</div>}</div></section>
  <footer><span>GJORD FÖR STOCKHOLM <b>✳</b></span><span>SL-DATA · VÄDERDATA FRÅN SMHI</span></footer></div></main></div>;
}

export default App;
