import { useEffect, useState, type ChangeEvent, type DragEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { analyzeIv, findSpecies, loadPokemonCatalog, type PokemonDexEntry } from "../services/ivCalculator";
import { scanPokeIdleImage } from "../services/paddleIvScanner";
import { EMPTY_IV_SCAN, STAT_LABELS, type IvScanFields } from "../types/ivScanner";
import "./vplab.css";

const sprite=(n?:number)=>n?`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`:"";
const example:IvScanFields={species:"Scizor",level:"302",quality:"1.78",ivTotal:"",ivMaximum:"192",power:"",stats:["","","","","",""]};
const typeNames:Record<string,string>={bug:"Inseto",steel:"Aço",fire:"Fogo",water:"Água",electric:"Elétrico",grass:"Planta",ice:"Gelo",fighting:"Lutador",poison:"Veneno",ground:"Terra",flying:"Voador",psychic:"Psíquico",rock:"Pedra",ghost:"Fantasma",dragon:"Dragão",dark:"Sombrio",fairy:"Fada",normal:"Normal"};

export function IvScannerPage(){
 const [searchParams]=useSearchParams(),[catalog,setCatalog]=useState<PokemonDexEntry[]>([]);
 const [cards,setCards]=useState<[IvScanFields,IvScanFields]>([{...example,stats:[...example.stats]},{...example,stats:[...example.stats]}]);
 const [modes,setModes]=useState<["manual"|"image","manual"|"image"]>(["manual","manual"]);
 const [busy,setBusy]=useState<[boolean,boolean]>([false,false]),[status,setStatus]=useState(["",""]);
 useEffect(()=>{void loadPokemonCatalog().then(entries=>{setCatalog(entries);const requested=searchParams.get("p");const p=entries.find(x=>x.s===requested);if(p)setCards(c=>[{...c[0],species:p.m},c[1]])})},[searchParams]);
 useEffect(()=>{const paste=(e:ClipboardEvent)=>{const file=[...(e.clipboardData?.files??[])].find(x=>x.type.startsWith("image/"));if(file)void read(0,file)};addEventListener("paste",paste);return()=>removeEventListener("paste",paste)},[catalog]);
 const analyses=cards.map((fields)=>{const p=findSpecies(catalog,fields.species);return p?analyzeIv(fields,p):null});
 const update=(side:number,next:IvScanFields)=>setCards(c=>side===0?[next,c[1]]:[c[0],next]);
 const read=async(side:number,file:File)=>{setBusy(x=>side===0?[true,x[1]]:[x[0],true]);setStatus(x=>side===0?["Lendo imagem com PP-OCRv6…",x[1]]:[x[0],"Lendo imagem com PP-OCRv6…"]);try{const r=await scanPokeIdleImage(file);update(side,r.fields);setStatus(x=>side===0?[`${Math.round(r.confidence*100)}% de confiança · confira os campos`,x[1]]:[x[0],`${Math.round(r.confidence*100)}% de confiança · confira os campos`])}catch(e){const message=e instanceof Error?e.message:"Não foi possível ler a imagem.";setStatus(x=>side===0?[message,x[1]]:[x[0],message])}finally{setBusy(x=>side===0?[false,x[1]]:[x[0],false])}};
 return <main className="vplab-react iv-v4"><div className="container">
  <header className="iv-v4__intro"><span className="vplab-react__eyebrow">Avaliar IV</span><h1>Esse Pokémon é bom — e é melhor que o outro?</h1><div className="iv-v4__title"><p>Preencha manualmente ou solte o print do card. O VPLab estima <b>cada IV individual</b>, dá a faixa provável do IV total com nível de confiança, <b>compara dois Pokémon stat por stat</b> e gera um card para compartilhar.</p><div className="iv-v4__actions"><button>?</button><button onClick={()=>setCards([example,{...example}])}>↻ Preencher exemplo</button><button onClick={()=>setCards([EMPTY_IV_SCAN,EMPTY_IV_SCAN])}>× Resetar dados</button></div></div></header>
  <div className="iv-v4__compare">{cards.map((fields,side)=><IvCard key={side} side={side} fields={fields} catalog={catalog} mode={modes[side]} busy={busy[side]} status={status[side]} analysis={analyses[side]} setMode={mode=>setModes(x=>side===0?[mode,x[1]]:[x[0],mode])} update={next=>update(side,next)} read={file=>void read(side,file)}/>)}</div>
  <p className="iv-v4__note">Fórmula oficial: stat = arredondar((base + 2×IV) × nível/100 × Qualidade^exp). Em níveis baixos a faixa pode ser mais larga.</p>
 </div></main>;
}

function IvCard({side,fields,catalog,mode,busy,status,analysis,setMode,update,read}:{side:number;fields:IvScanFields;catalog:PokemonDexEntry[];mode:"manual"|"image";busy:boolean;status:string;analysis:ReturnType<typeof analyzeIv>|null;setMode:(m:"manual"|"image")=>void;update:(f:IvScanFields)=>void;read:(f:File)=>void}){
 const selected=findSpecies(catalog,fields.species);const set=(key:keyof Omit<IvScanFields,"stats">,value:string)=>update({...fields,[key]:value});const stat=(i:number,value:string)=>{const stats=[...fields.stats] as IvScanFields["stats"];stats[i]=value;update({...fields,stats})};
 const file=(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(f)read(f)};
 const onDrop=(e:DragEvent<HTMLLabelElement>)=>{e.preventDefault();const f=[...e.dataTransfer.files].find(x=>x.type.startsWith("image/"));if(f)read(f)};
 return <section className={`iv-v4__card side-${side}`}><div className="iv-v4__cardhead"><strong><i/> Pokémon {side===0?"A":"B"}</strong><div><button className={mode==="manual"?"active":""} onClick={()=>setMode("manual")}>Manual</button><button className={mode==="image"?"active":""} onClick={()=>setMode("image")}>Usar imagem</button></div></div>
  {mode==="image"&&<label className="iv-v4__upload" onDragOver={e=>e.preventDefault()} onDrop={onDrop}><input type="file" accept="image/*" onChange={file}/><b>{busy?"Lendo imagem…":"Selecionar, arrastar ou colar print"}</b><span>PNG, JPG ou WebP · Ctrl + V</span></label>}
  <div className="iv-v4__identity"><div className="iv-v4__sprite">{selected&&<img src={sprite(selected.n)} alt=""/>}</div><div className="iv-v4__species"><label>Pokémon<input list={`species-${side}`} value={fields.species} onChange={e=>set("species",e.target.value)}/><datalist id={`species-${side}`}>{catalog.map(p=><option key={p.n} value={p.m}/>)}</datalist></label><div>{selected?.t.map(type=><span className="iv-v4__type" key={type}><img src={`/assets/vplab/route/types-v2/${type}.png`} alt=""/>{typeNames[type]??type}</span>)}</div></div></div>
  <div className="iv-v4__fields"><label>Nível<input value={fields.level} onChange={e=>set("level",e.target.value)} placeholder="302"/></label><label>Qualidade<input value={fields.quality} onChange={e=>set("quality",e.target.value)} placeholder="1.78"/></label><label>IV total<input value={fields.ivTotal} onChange={e=>set("ivTotal",e.target.value)} placeholder="opcional"/></label><label>Power<input value={fields.power} onChange={e=>set("power",e.target.value)} placeholder="opcional"/></label></div>
  <div className="iv-v4__stats">{STAT_LABELS.map((x,i)=><label key={x}>{x}<input value={fields.stats[i]} onChange={e=>stat(i,e.target.value)} placeholder="—"/></label>)}</div>
  <div className="iv-v4__result">{analysis?<><span>IV provável <b>{analysis.total.likely}/192</b> · confiança {analysis.confidence}%</span><div>{STAT_LABELS.map((x,i)=><small key={x}>{x} <b>{analysis.ivs[i]}</b></small>)}</div><Link to={`/vplab/pokefipe?p=${analysis.species.s}&iv=${analysis.total.likely}&multiplier=${fields.quality}&level=${fields.level}`}>Ver estimativa na PokeFipe →</Link></>:<span>{status||"Preencha nível, qualidade e os 6 stats deste card."}</span>}</div>
 </section>;
}
