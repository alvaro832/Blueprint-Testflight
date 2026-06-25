export type Vendor = "OpenAI"|"Anthropic"|"Google"|"xAI"|"Meta"|"DeepSeek"|"Mistral"|"Local"|"Custom";
export interface ModelSpec { id:string; name:string; vendor:Vendor; inputPerM:number; outputPerM:number; tier:1|2|3|4; context:string; }
export const TIER_LABEL: Record<number,string> = {1:"Light",2:"Standard",3:"Advanced",4:"Frontier"};
export const MODELS: ModelSpec[] = [
  { id:"gpt-4o", name:"GPT-4o", vendor:"OpenAI", inputPerM:2.5, outputPerM:10, tier:3, context:"128K" },
  { id:"gpt-4o-mini", name:"GPT-4o mini", vendor:"OpenAI", inputPerM:0.15, outputPerM:0.6, tier:1, context:"128K" },
  { id:"o3-mini", name:"o3-mini", vendor:"OpenAI", inputPerM:1.1, outputPerM:4.4, tier:3, context:"200K" },
  { id:"claude-opus", name:"Claude Opus", vendor:"Anthropic", inputPerM:15, outputPerM:75, tier:4, context:"200K" },
  { id:"claude-sonnet", name:"Claude Sonnet", vendor:"Anthropic", inputPerM:3, outputPerM:15, tier:3, context:"200K" },
  { id:"claude-haiku", name:"Claude Haiku", vendor:"Anthropic", inputPerM:0.8, outputPerM:4, tier:2, context:"200K" },
  { id:"gemini-pro", name:"Gemini 1.5 Pro", vendor:"Google", inputPerM:1.25, outputPerM:5, tier:3, context:"1M" },
  { id:"gemini-flash", name:"Gemini 1.5 Flash", vendor:"Google", inputPerM:0.075, outputPerM:0.3, tier:1, context:"1M" },
  { id:"grok-2", name:"Grok 2", vendor:"xAI", inputPerM:2, outputPerM:10, tier:3, context:"131K" },
  { id:"llama-70b", name:"Llama 3.1 70B", vendor:"Meta", inputPerM:0.2, outputPerM:0.2, tier:2, context:"128K" },
  { id:"deepseek-chat", name:"DeepSeek V3", vendor:"DeepSeek", inputPerM:0.27, outputPerM:1.1, tier:3, context:"64K" },
  { id:"mistral-large", name:"Mistral Large", vendor:"Mistral", inputPerM:2, outputPerM:6, tier:3, context:"128K" },
  { id:"local", name:"Local model", vendor:"Local", inputPerM:0, outputPerM:0, tier:2, context:"varies" },
];
export function getModel(id:string){ return MODELS.find((m)=>m.id===id); }
export function callCost(model:ModelSpec, inputTokens:number, outputTokens:number){ return (inputTokens/1e6)*model.inputPerM + (outputTokens/1e6)*model.outputPerM; }
export interface RoutingResult { score:number; requiredTier:1|2|3|4; reasons:{delta:string;label:string;tone:"good"|"warn"}[]; ranked:{model:ModelSpec;cost:number;capable:boolean}[]; recommended?:ModelSpec; }
export function routeTask(taskDescription:string, inputTokens:number, outputTokens:number): RoutingResult {
  const t = taskDescription.toLowerCase();
  let score = 10;
  const reasons: RoutingResult["reasons"] = [];
  const hard = /(reason|analyz|evaluate|critique|legal|contract|security|architect|debug|prove|strateg|nuance|negotiat|multi-step|multistep|complex|research|plan\b)/g;
  const easy = /(classif|label|extract|tag|format|translate|list|categor|lookup|rephrase|spellcheck|summari)/g;
  const hardMatches = (t.match(hard)||[]).length;
  const easyMatches = (t.match(easy)||[]).length;
  if (hardMatches){ score += hardMatches*18; reasons.push({delta:`+${hardMatches*18}`,label:`Reasoning-heavy verbs (${hardMatches})`,tone:"warn"}); }
  if (easyMatches){ score -= easyMatches*12; reasons.push({delta:`-${easyMatches*12}`,label:`Simple/structured task (${easyMatches})`,tone:"good"}); }
  if (outputTokens>1000){ score+=20; reasons.push({delta:"+20",label:"Long generation (>1k output)",tone:"warn"}); }
  else if (outputTokens>0 && outputTokens<80){ score-=10; reasons.push({delta:"-10",label:"Tiny output",tone:"good"}); }
  if (inputTokens>20000){ score+=18; reasons.push({delta:"+18",label:"Very large context",tone:"warn"}); }
  else if (inputTokens>0 && inputTokens<800){ score-=6; reasons.push({delta:"-6",label:"Small context",tone:"good"}); }
  score = Math.max(2, Math.min(99, Math.round(score)));
  const requiredTier:1|2|3|4 = score<25?1:score<50?2:score<75?3:4;
  const ranked = MODELS.map((model)=>({ model, cost:callCost(model,inputTokens,outputTokens), capable:model.tier>=requiredTier })).sort((a,b)=>a.cost-b.cost);
  const hosted = ranked.find((r)=>r.capable && r.model.vendor!=="Local");
  const anyCapable = ranked.find((r)=>r.capable);
  const recommended = (hosted ?? anyCapable)?.model;
  return { score, requiredTier, reasons, ranked, recommended };
}
