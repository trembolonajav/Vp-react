export const BREEDING_RULES={unlock:60,maxDiff:.15,normalCap:2.6,wildCap:1.8,ivChance:.05,gold:2_000_000,stones:20,doubleStones:40,normalPheromones:9,shinyPheromones:{C:50,B:150,A:1500}};
export const BREEDING_GAINS={
  free:{title:"Caminho gratuito",dist:[[.005,50],[.010,35],[.020,12],[.040,3]] as Array<[number,number]>},
  pheromone:{title:"Com Strange Pheromone",dist:[[.15,50],[.20,30],[.25,15],[.30,5]] as Array<[number,number]>},
};
const expected=(key:keyof typeof BREEDING_GAINS)=>BREEDING_GAINS[key].dist.reduce((sum,[gain,chance])=>sum+gain*chance/100,0);
export interface BreedingInput{qa:number;qb:number;iva:number;ivb:number;formA:"normal"|"shiny";formB:"normal"|"shiny";stones:boolean;pheromone:boolean;target:number;shinyTier:"C"|"B"|"A"}
export function calculateBreeding(input:BreedingInput){
  const bestIsA=input.qa>=input.qb,bestQ=Math.max(input.qa,input.qb),lowQ=Math.min(input.qa,input.qb);
  const diff=Math.round((bestQ-lowQ)*1000)/1000,sameForm=input.formA===input.formB;
  const shinyPair=input.formA==="shiny"&&input.formB==="shiny",cap=shinyPair?Infinity:BREEDING_RULES.normalCap;
  const withinCap=input.qa<=cap&&input.qb<=cap,compatible=diff<=BREEDING_RULES.maxDiff+1e-9&&sameForm&&withinCap;
  const inheritedIv=Math.min(192,Math.max(0,bestIsA?input.iva:input.ivb));
  const target=Math.min(Math.max(input.target||.8,.8),cap),route=input.pheromone?"pheromone":"free";
  const outcomes=BREEDING_GAINS[route].dist.map(([gain,chance])=>({gain,chance,result:Math.min(cap,bestQ+gain)}));
  const plan=(key:keyof typeof BREEDING_GAINS)=>{
    const gain=expected(key),missing=Math.max(0,target-bestQ),eggs=missing===0?0:Math.ceil(+(missing/gain).toFixed(6));
    const stonesPerEgg=input.stones?BREEDING_RULES.doubleStones:BREEDING_RULES.stones;
    const pheromonesPerEgg=key==="pheromone"?(shinyPair?BREEDING_RULES.shinyPheromones[input.shinyTier]:BREEDING_RULES.normalPheromones):0;
    return {key,gain,eggs,parents:eggs*2,gold:eggs*BREEDING_RULES.gold,stonesPerEgg,stones:eggs*stonesPerEgg,pheromonesPerEgg,pheromones:eggs*pheromonesPerEgg};
  };
  return {bestIsA,bestQ,diff,sameForm,shinyPair,compatible,inheritedIv,target,route,outcomes,expectedQuality:Math.min(cap,bestQ+expected(route)),expectedIv:Math.min(192,inheritedIv+(input.stones?BREEDING_RULES.ivChance:0)),plans:[plan("free"),plan("pheromone")],
    reason:compatible?"Par compatível":!sameForm?"Normal e Shiny não podem formar um par.":!withinCap?"Pokémon Normal não pode ultrapassar 2,600 de Quality.":"A diferença máxima de Quality é 0,15."};
}
