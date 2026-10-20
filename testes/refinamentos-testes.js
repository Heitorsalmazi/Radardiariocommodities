'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').replace(/\r\n/g,'\n');
function extract(name){
  const re = new RegExp('^([ \t]*)function '+name+'\\(', 'm');
  const m = re.exec(html); assert(m, 'Função ausente: '+name);
  const end = html.indexOf('\n'+m[1]+'}',m.index);
  assert(end>m.index,'Fim da função ausente: '+name);
  return html.slice(m.index,end+1+m[1].length+1);
}
let checks=0;
function check(name,run){run();checks++;console.log('OK '+name);}
check('sintaxe de todos os scripts executáveis',()=>{
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
    if(/\bsrc\s*=|type\s*=\s*["']application\/json/.test(m[1]))continue;
    new vm.Script(m[2]);
  }
});
const elements={};
function el(id){return elements[id]||(elements[id]={innerHTML:'',textContent:'',className:''});}
const n2=(v,c=2)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:c,maximumFractionDigits:c});
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const D=Date;
class FixedDate extends D {constructor(...args){super(...(args.length?args:['2026-10-20T12:00:00Z']));}}
let E={p:{veCabecasVender:'300'},nPersonalizado:0,nCalculadora:0,nPadrao:39};
let trades={BGI:{venda:3300}};
const motor={esc,n2,num:v=>v==null||v===''?null:Number(v),dBR:d=>new D(d).toLocaleDateString('pt-BR'),
 chaveVenc:sn=>sn==='BGIV26'?2026*12+9:sn==='BGIF27'?2027*12:2027*12+3,
 travas:()=>trades};
const ctx=vm.createContext({Date:FixedDate,Math,isFinite,console,document:{getElementById:el},
 mot:()=>motor,rotC:sn=>sn,divergenciaUnidade:()=>'',premEfe:()=>E});
['sinalCls','sinalTxt','insuf','linkPara','card','cardCotacao','renderCab','avisoHorizonte','renderResumoOperacao','grupoSinal','rotulosFinais'].forEach(n=>vm.runInContext(extract(n),ctx));
const L=[...Array(7)].map((_,i)=>({f:{k:i===0?'bgi':'k'+i,rot:'Fonte '+i,fonte:'Fonte'},aba:i===0?'BGIV26':'S'+i,u:{data:new D(i===6?'2026-10-01T12:00:00Z':'2026-10-19T12:00:00Z'),pregoes:10,repetidas:0}}));
check('fonte carregada antiga não aparece como atualizada',()=>{
 ctx.renderCab(L);assert.match(el('veDataAtu').textContent,/7\/7 carregadas.*6 na referência.*1 com defasagem/);assert.equal(el('veDataAtu').className,'ve-atencao');assert.equal(L[6].defasagem,18);assert.match(el('veDiag').innerHTML,/18 dia\(s\) antes da referência/);
});
check('fontes ausentes não recebem status atualizado',()=>{
 ctx.renderCab([{f:{rot:'Ausente',fonte:'Teste'},u:null,aba:null}]);assert.equal(el('veDataAtu').textContent,'nenhuma fonte carregada');assert.match(el('veDiag').innerHTML,/sem contrato vigente/);
});
const r={d:105,lL:557.63,llP:0.0729,lLote:167289,bLL:359.82,recB:7652.36};
check('contrato anterior ao abate é destacado; contrato posterior não',()=>{
 assert.match(ctx.avisoHorizonte(r,'BGIV26'),/Vencimento anterior ao abate projetado/);assert.equal(ctx.avisoHorizonte(r,'BGIJ27'),'');assert.equal(ctx.avisoHorizonte(null,'BGIV26'),'');
});
check('resumo usa lucro líquido e marca cenário padrão',()=>{
 ctx.renderResumoOperacao(L,'BGIV26',r,388.1,E);const h=el('veDecisao').innerHTML;assert.match(h,/Cenário padrão/);assert.match(h,/557,63/);assert.match(h,/167.289,00/);assert.match(h,/359,82/);assert.match(el('veHorizonte').innerHTML,/Vencimento anterior/);assert.doesNotMatch(h,/748,44/);
});
check('ausência de premissas não vira lucro zero e limpa aviso antigo',()=>{
 ctx.renderResumoOperacao(L,'BGIV26',null,388.1,E);assert.match(el('veDecisao').innerHTML,/Complete as premissas/);assert.doesNotMatch(el('veDecisao').innerHTML,/557,63/);assert.equal(el('veHorizonte').innerHTML,'');
});
check('personalização e excesso de cobertura ficam explícitos',()=>{
 E={...E,nPersonalizado:1,p:{veCabecasVender:'1'}};trades={BGI:{venda:330}};ctx.renderResumoOperacao(L,'BGIV26',r,388.1,E);assert.match(el('veDecisao').innerHTML,/Premissas personalizadas/);assert.match(el('veDecisao').innerHTML,/Posição acima do volume físico/);
});
check('classificação preserva preço relacionado no mesmo fundamento',()=>{
 ['Preço na janela','Tendência da janela','Distância da média','Volatilidade recente'].forEach(n=>assert.equal(ctx.grupoSinal(n),'Preço e tendência'));assert.equal(ctx.grupoSinal('Curva contra o custo'),'Economia da operação');assert.equal(ctx.grupoSinal('Travar no passado'),'Base e validação histórica');assert.equal(ctx.grupoSinal('Sazonalidade do mês'),'Sazonalidade e ciclo');
});
check('rótulos finais próximos recebem posições distintas',()=>{
 const a=ctx.rotulosFinais([{name:'Físico CEPEA',y:[380],line:{color:'green'}},{name:'Futuro BGIV26',y:[381],line:{color:'blue'}}]);assert.notEqual(a[0].yshift,a[1].yshift);assert.equal(a[0].text,'CEPEA');assert.equal(a[1].text,'BGIV26');
});
check('cenários exibem bruto, líquido por cabeça e líquido do lote',()=>{
 const c=vm.createContext({console,document:{getElementById:el},monta:()=>true,M:()=>({premissas:()=>E,num:Number,simular:()=>({custoTotalCabeca:7094.73,custoArrobaProduzida:217.12,custoArrobaComercializada:359.82,breakEvenBruto:350.14,resultadoCabecaBruto:748.44,resultadoCabecaLiquido:557.63,resultadoLote:167289,margemBrutaPct:9.78,margemLiquidaPct:7.29,roi:8.16})}),cfg:()=>({}),lerCen:()=>({}),precoVenda:()=>({preco:388.1}),CENS:[{id:'base',rot:'Base'}],CEN_CAMPOS:[],rs:v=>'R$ '+n2(v),pct:v=>n2(v)+'%',n2,esc,sinal:()=>'',insuf:()=>''});
 vm.runInContext(extract('renderCenarios'),c);c.renderCenarios();const h=el('ioCen').innerHTML;assert.match(h,/Margem bruta por cabeça<\/th><td[^>]*>R\$ 748,44/);assert.match(h,/Lucro líquido por cabeça<\/th><td[^>]*>R\$ 557,63/);assert.match(h,/Lucro líquido do lote<\/th><td[^>]*>R\$ 167.289,00/);assert.doesNotMatch(h,/Margem operacional/);
});
console.log(checks+' verificações de apresentação passaram.');
