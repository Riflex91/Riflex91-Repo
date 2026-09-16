import test from 'node:test';
import assert from 'node:assert/strict';
import { BegrenzterRingpuffer } from '../../erzeugt/telemetrie/begrenzter-ringpuffer.js';
import { berechneSha256 } from '../../erzeugt/telemetrie/sha256.js';
import { Flugschreiber } from '../../erzeugt/telemetrie/flugschreiber.js';
import { TelemetrieSpeicher, SchluesselWertTelemetrieAblage } from '../../erzeugt/telemetrie/telemetrie-speicher.js';
import { VorfallErkennung } from '../../erzeugt/telemetrie/vorfall-erkennung.js';
import { VorfallPaketSammler } from '../../erzeugt/telemetrie/vorfall-paket-sammler.js';
import { EreignisZentrale } from '../../erzeugt/kern/ereignis-zentrale.js';
import { FortlaufenderEreignisSchreiber } from '../../erzeugt/telemetrie/fortlaufender-ereignis-schreiber.js';
import { EntscheidungsAktionsSpur } from '../../erzeugt/telemetrie/entscheidungs-aktions-spur.js';
import { erstelleDienstVerbrauchsEintrag, schreibeDienstVerbrauchsEreignis } from '../../erzeugt/telemetrie/dienst-verbrauchs-telemetrie.js';
import { TelemetrieZentrale } from '../../erzeugt/telemetrie/telemetrie-zentrale.js';

class Speicher { constructor(){ this.map=new Map(); } getItem(k){ return this.map.get(k) ?? null; } setItem(k,v){ this.map.set(k,v); } }
const e=(n,t,details={})=>({kennung:`e${n}`,laufendeNummer:n,zeitpunkt:t,name:'test',quelle:'test',ablaufKennung:'a',details});

test('SHA-256 entspricht dem bekannten Testvektor',()=> assert.equal(berechneSha256('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));

test('Ringpuffer begrenzt Eintraege, Bytes und Alter',()=>{
  const p=new BegrenzterRingpuffer({maxEintraege:2,maxBytes:100,maxAlterMillisekunden:10,ermittleZeitpunkt:x=>x.t});
  p.fuegeHinzu({t:0,v:'a'},0); p.fuegeHinzu({t:5,v:'b'},5); p.fuegeHinzu({t:6,v:'c'},6);
  assert.deepEqual(p.liste().map(x=>x.v),['b','c']);
  p.bereinige(20); assert.deepEqual(p.liste(),[]);
});

test('Flugschreiber erzeugt begrenzte, pruefbare Segmente',()=>{
  const f=new Flugschreiber({sitzungKennung:'s1',ringpuffer:{maxEintraege:10,maxBytes:10000,maxAlterMillisekunden:1000},segmentMaxEintraege:2,segmentMaxBytes:10000,segmentMaxAlterMillisekunden:1000});
  assert.equal(f.zeichneAuf(e(1,1)).abgeschlosseneSegmente.length,0);
  const r=f.zeichneAuf(e(2,2)); assert.equal(r.abgeschlosseneSegmente.length,1);
  const s=r.abgeschlosseneSegmente[0]; assert.equal(s.sequenzStart,1); assert.equal(s.sequenzEnde,2); assert.equal(s.ereignisAnzahl,2); assert.equal(s.sha256,berechneSha256(s.inhalt));
});

test('Dauertelemetrie ueberlebt Neustart ohne doppelte Zaehler und fasst 24h korrekt zusammen',()=>{
  const backing=new Speicher(); const ablage=new SchluesselWertTelemetrieAblage(backing,'t');
  const d=24*60*60*1000;
  let s=new TelemetrieSpeicher(ablage,{maxEintraege:100,maxBytes:100000,maxAlterMillisekunden:3*d});
  assert.equal(s.erfasseLaufzeitAbschnitt({schemaVersion:1,kennung:'run1',start:0,ende:d/2},d/2),true);
  assert.equal(s.erfasseLeistungsZaehler({schemaVersion:1,kennung:'m1',zeitpunkt:100,charakterName:'Mage',erfahrungGewonnen:1000,goldGewonnen:500,tode:1,rueckzuege:2,verbindungsAbbrueche:1,neustarts:0,automatischBehoben:1,ungefangeneFehler:0},d/2),true);
  s=new TelemetrieSpeicher(ablage,{maxEintraege:100,maxBytes:100000,maxAlterMillisekunden:3*d});
  assert.equal(s.erfasseLaufzeitAbschnitt({schemaVersion:1,kennung:'run1',start:0,ende:d/2},d/2),false);
  s.erfasseLaufzeitAbschnitt({schemaVersion:1,kennung:'run2',start:d/2,ende:d},d);
  s.erfasseLeistungsZaehler({schemaVersion:1,kennung:'m2',zeitpunkt:d/2,charakterName:'Mage',erfahrungGewonnen:1000,goldGewonnen:500,tode:0,rueckzuege:0,verbindungsAbbrueche:0,neustarts:1,automatischBehoben:0,ungefangeneFehler:0},d);
  s.erfasseLaufzeitAbschnitt({schemaVersion:1,kennung:'char1',start:0,ende:d,charakterName:'Mage'},d);
  const z=s.fasseLeistungZusammen(0,d); assert.equal(z.vollstaendig,true); assert.equal(z.gesamt.laufzeitMillisekunden,d); assert.equal(z.gesamt.neustarts,1); assert.equal(z.charaktere[0].erfahrungGewonnen,2000); assert.equal(z.charaktere[0].laufzeitMillisekunden,d);
});

test('Ueberlappende Laufzeit wird nicht doppelt gezaehlt',()=>{
  const backing=new Speicher(); const s=new TelemetrieSpeicher(new SchluesselWertTelemetrieAblage(backing,'x'),{maxEintraege:100,maxBytes:100000,maxAlterMillisekunden:100000});
  s.erfasseLaufzeitAbschnitt({schemaVersion:1,kennung:'a',start:0,ende:100},100);
  s.erfasseLaufzeitAbschnitt({schemaVersion:1,kennung:'b',start:50,ende:150},150);
  assert.equal(s.fasseLeistungZusammen(0,150).gesamt.laufzeitMillisekunden,150);
});

test('Stillstand, Zeitueberschreitung und unerwarteter Zustandswechsel werden erklaerend erkannt',()=>{
  const v=new VorfallErkennung({stillstandNachMillisekunden:10,schleifenFensterMillisekunden:100,schleifenWiederholungen:3,schleifenMusterLaengeMax:2});
  const base={kennung:'p1',ablaufKennung:'farm',zeitpunkt:0,zustand:'suche',fortschrittKennung:'f1',entscheidungKennung:'d1',gestartetAm:0,letzterFortschrittAm:0,zeitlimitMillisekunden:15,erlaubteNaechsteZustaende:['angriff']};
  assert.equal(v.pruefe(base).length,0);
  const r=v.pruefe({...base,kennung:'p2',zeitpunkt:20,zustand:'bank'});
  assert.ok(r.some(x=>x.art==='stillstand')); assert.ok(r.some(x=>x.art==='zeitueberschreitung')); assert.ok(r.some(x=>x.art==='unerwarteter_zustandswechsel'));
  for(const x of r){ assert.ok(x.meldung.warumIstEsPassiert.length>0); assert.ok(x.meldung.wasHatDerBotGetan.length>0); assert.ok(x.meldung.wasSollDerNutzerTun.length>0); }
});

test('Wiederholungsschleife wird erkannt',()=>{
  const v=new VorfallErkennung({stillstandNachMillisekunden:1000,schleifenFensterMillisekunden:100,schleifenWiederholungen:3,schleifenMusterLaengeMax:2});
  const states=[['a','d1'],['b','d2'],['a','d1'],['b','d2'],['a','d1'],['b','d2']]; let found=false;
  states.forEach(([zustand,entscheidung],i)=>{const r=v.pruefe({kennung:`p${i}`,ablaufKennung:'loop',zeitpunkt:i,zustand,fortschrittKennung:'gleich',entscheidungKennung:entscheidung,gestartetAm:0,letzterFortschrittAm:i}); if(r.some(x=>x.art==='schleife')) found=true;});
  assert.equal(found,true);
});

test('Vorfallpaket enthaelt Daten vor und nach dem Fehler',()=>{
  const f=new Flugschreiber({sitzungKennung:'s1',ringpuffer:{maxEintraege:20,maxBytes:10000,maxAlterMillisekunden:1000},segmentMaxEintraege:20,segmentMaxBytes:10000,segmentMaxAlterMillisekunden:1000});
  f.zeichneAuf(e(1,90)); f.zeichneAuf(e(2,100));
  const v=new VorfallErkennung({stillstandNachMillisekunden:1,schleifenFensterMillisekunden:100,schleifenWiederholungen:3,schleifenMusterLaengeMax:2});
  v.pruefe({kennung:'p1',ablaufKennung:'x',zeitpunkt:99,zustand:'a',fortschrittKennung:'f',entscheidungKennung:'d',gestartetAm:0,letzterFortschrittAm:99});
  const incident=v.pruefe({kennung:'p2',ablaufKennung:'x',zeitpunkt:100,zustand:'a',fortschrittKennung:'f',entscheidungKennung:'d',gestartetAm:0,letzterFortschrittAm:98})[0];
  const p=new VorfallPaketSammler({vorherMillisekunden:20,nachherMillisekunden:10,maxOffenePakete:2,maxEreignisseProPaket:10,maxBytesProPaket:10000});
  p.oeffne(incident,f); p.verarbeiteEreignis(e(3,105)); const fertig=p.schliesseFaellige(110)[0];
  assert.ok(fertig.ereignisseVorher.length>=1); assert.equal(fertig.ereignisseNachher.length,1);
});

test('Fortlaufender Ereignisschreiber und Entscheidungsspur liefern geordnete Ereignisse',()=>{
  const z=new EreignisZentrale(); const gesehen=[]; z.fuegeEmpfaengerHinzu('*',x=>gesehen.push(x));
  const w=new FortlaufenderEreignisSchreiber(z,{sitzungKennung:'s'}); const spur=new EntscheidungsAktionsSpur(w);
  spur.schreibeEntscheidung({entscheidungKennung:'d1',zeitpunkt:1,ablaufKennung:'a',quelle:'planung',entscheidung:'farm',grund:'test',details:{}});
  spur.schreibeAktionsPhase({aktionsKennung:'x1',zeitpunkt:2,ablaufKennung:'a',quelle:'aktion',phase:'gestartet',grund:'test',details:{}});
  assert.deepEqual(gesehen.map(x=>x.laufendeNummer),[1,2]); assert.deepEqual(gesehen.map(x=>x.name),['entscheidung_getroffen','aktionsphase']);
});


test('Geschuetzte Wiederholungssegmente werden bei Speicherknappheit nicht automatisch verdraengt',()=>{
  const backing=new Speicher();
  const s=new TelemetrieSpeicher(new SchluesselWertTelemetrieAblage(backing,'protected'),{maxEintraege:2,maxBytes:1200,maxAlterMillisekunden:10});
  const f=new Flugschreiber({sitzungKennung:'s',ringpuffer:{maxEintraege:10,maxBytes:10000,maxAlterMillisekunden:1000},segmentMaxEintraege:1,segmentMaxBytes:500,segmentMaxAlterMillisekunden:1000});
  const seg1=f.zeichneAuf(e(1,1,{x:'a'})).abgeschlosseneSegmente[0];
  const seg2=f.zeichneAuf(e(2,2,{x:'b'})).abgeschlosseneSegmente[0];
  const seg3=f.zeichneAuf(e(3,3,{x:'c'})).abgeschlosseneSegmente[0];
  assert.equal(s.erfasseWiederholungsSegment(seg1,1),true);
  assert.equal(s.erfasseWiederholungsSegment(seg2,2),true);
  assert.equal(s.erfasseWiederholungsSegment(seg3,3),false);
  assert.deepEqual(s.listeWiederholungsSegmente().map(x=>x.segmentKennung),[seg1.segmentKennung,seg2.segmentKennung]);
});


test('Blockierte externe Anfrage wird mit lokalem und Anbieter-Verbrauch als Ereignis festgehalten',()=>{
  const z=new EreignisZentrale(); const gesehen=[]; z.fuegeEmpfaengerHinzu('*',x=>gesehen.push(x));
  const w=new FortlaufenderEreignisSchreiber(z,{sitzungKennung:'dienst'});
  const eintrag=erstelleDienstVerbrauchsEintrag({
    kennung:'dv1',zeitpunkt:10,
    stand:{dienstKennung:'supabase',grenzeKennung:'rows',fensterKennung:'2026-09-16',lokalReserviert:90,vomAnbieterGemeldet:95},
    entscheidung:{erlaubt:false,schutzstufe:'blockiert',grund:'Sicheres Budget erschoepft.',dienstKennung:'supabase',vorgangKennung:'upload1',verbleibendNachReservierung:{rows:0}}
  });
  schreibeDienstVerbrauchsEreignis(w,eintrag);
  assert.equal(gesehen[0].name,'dienst_anfrage_blockiert');
  assert.equal(gesehen[0].details.lokalReserviert,90);
  assert.equal(gesehen[0].details.vomAnbieterGemeldet,95);
  assert.equal(gesehen[0].details.schutzstufe,'blockiert');
});

test('TelemetrieZentrale persistiert abgeschlossene Segmente und Vorfallpakete',()=>{
  const backing=new Speicher();
  const speicher=new TelemetrieSpeicher(new SchluesselWertTelemetrieAblage(backing,'central'),{maxEintraege:100,maxBytes:100000,maxAlterMillisekunden:100000});
  const z=new EreignisZentrale();
  const f=new Flugschreiber({sitzungKennung:'s',ringpuffer:{maxEintraege:20,maxBytes:10000,maxAlterMillisekunden:1000},segmentMaxEintraege:2,segmentMaxBytes:10000,segmentMaxAlterMillisekunden:1000});
  const v=new VorfallErkennung({stillstandNachMillisekunden:1,schleifenFensterMillisekunden:100,schleifenWiederholungen:3,schleifenMusterLaengeMax:2});
  const p=new VorfallPaketSammler({vorherMillisekunden:20,nachherMillisekunden:1,maxOffenePakete:2,maxEreignisseProPaket:20,maxBytesProPaket:10000});
  const tz=new TelemetrieZentrale(z,f,speicher,v,p); tz.verbinde();
  const w=new FortlaufenderEreignisSchreiber(z,{sitzungKennung:'s'});
  w.schreibe({zeitpunkt:1,name:'x',quelle:'test',ablaufKennung:'a',details:{}});
  w.schreibe({zeitpunkt:2,name:'y',quelle:'test',ablaufKennung:'a',details:{}});
  assert.equal(speicher.listeWiederholungsSegmente().length,1);
  tz.beobachteAblauf({kennung:'p1',ablaufKennung:'a',zeitpunkt:2,zustand:'x',fortschrittKennung:'f',entscheidungKennung:'d',gestartetAm:0,letzterFortschrittAm:2});
  tz.beobachteAblauf({kennung:'p2',ablaufKennung:'a',zeitpunkt:4,zustand:'x',fortschrittKennung:'f',entscheidungKennung:'d',gestartetAm:0,letzterFortschrittAm:2});
  const ergebnis=tz.aktualisiere(5);
  assert.ok(ergebnis.fertigeVorfallPakete.length>=1);
  assert.ok(speicher.listeVorfallPakete().length>=1);
});
