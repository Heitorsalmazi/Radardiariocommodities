# -*- coding: utf-8 -*-
"""
Grava os valores das fórmulas no dados.xlsx antes da publicação.

POR QUE ISTO EXISTE
    O Radar lê a planilha no navegador, e o navegador não calcula fórmula: ele
    lê o valor que ficou gravado no arquivo da última vez que alguém calculou.
    Quando a planilha é salva por uma biblioteca que preserva as fórmulas mas
    descarta os valores (o caso do openpyxl), toda célula com fórmula chega
    vazia ao Radar. Foi o que aconteceu em 27/10/2026: 44.604 fórmulas, nenhuma
    com valor. O boi gordo perdeu 41 datas, o bezerro deflacionado mudou de
    patamar e a sazonalidade, o ciclo e as volatilidades saíram erradas.

    O Excel mascara o problema porque recalcula ao abrir. Quem confere a
    planilha no Excel vê tudo certo.

O QUE O SCRIPT FAZ
    precisa    sai com 0 quando mais de 1% das fórmulas está sem valor
    recalcular abre a planilha no LibreOffice, recalcula e grava os valores
    validar    confere as abas que o Radar lê; sai com 1 se algo estiver errado

O IDIOMA IMPORTA
    Várias datas da planilha estão gravadas como TEXTO no formato dd/mm/aaaa
    ("21/02/2000"). O LibreOffice interpreta texto de data pelo idioma da
    planilha. Em inglês, "21/02/2000" não é data e a fórmula dá #VALUE!; pior,
    "02/08/2004" vira 8 de fevereiro em vez de 2 de agosto, e o deflator do
    bezerro sai errado SEM dar erro. Por isso o recálculo roda forçado em
    português do Brasil.

Só usa a biblioteca padrão do Python.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

# Abas e colunas que o Radar lê e que não podem chegar com fórmula sem valor.
# None = todas as colunas da aba. Nas abas de contrato, todas.
CRITICAS_FIXAS = {
    'BOI GORDO': None,
    'SOJA - PARANAGUÁ': None,
    'IGP-M Referência': None,
    'S.H BOI GORDO': ['A', 'B'],      # a série diária; as estatísticas mensais usam FILTER
}
PADRAO_CONTRATO = re.compile(r'^(BGI|CCM|SJC|DOL|WDO|DI1|ETH)[FGHJKMNQUVXZ]\d{2}$')

# Fórmulas que o LibreOffice anterior à versão 24.8 não calcula (FILTER, LET).
# Ficam sem valor também no arquivo bom de referência; não reprovam a planilha.
NAO_CALCULAVEIS = re.compile(r'_xlws\.FILTER|_xlfn\.LET|_xlpm\.', re.I)


def _abas(z: zipfile.ZipFile) -> dict:
    wb = z.read('xl/workbook.xml').decode('utf-8', 'replace')
    rels = z.read('xl/_rels/workbook.xml.rels').decode('utf-8', 'replace')
    alvo = dict(re.findall(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"', rels))
    alvo.update({a: b for b, a in re.findall(r'<Relationship[^>]*Target="([^"]+)"[^>]*Id="([^"]+)"', rels)})
    out = {}
    for nome, rid in re.findall(r'<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"', wb):
        t = alvo.get(rid, '').lstrip('/')
        out[_desescapa(nome)] = t if t.startswith('xl/') else 'xl/' + t
    return out


def _desescapa(s: str) -> str:
    return (s.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
             .replace('&quot;', '"').replace('&apos;', "'"))


_CELULA = re.compile(r'<c r="([A-Z]+)\d+"((?:[^>/]|/(?!>))*)(?:/>|>(.*?)</c>)', re.S)


def _celulas_formula(xml: str):
    """(coluna, texto da fórmula, valor gravado ou None) para cada célula com fórmula.

    Valor gravado é o <v>. Texto vazio conta como valor quando a célula é do
    tipo texto (t="str"): é o resultado legítimo de um SEERRO(...;"") ou de
    um SE(...;" "). Sem o tipo, <v></v> é só o lugar vazio que o openpyxl
    deixa quando descarta o cálculo."""
    for m in _CELULA.finditer(xml):
        attrs, corpo = m.group(2) or '', m.group(3) or ''
        if '<f' not in corpo:
            continue
        f = re.search(r'<f[^>]*>(.*?)</f>', corpo, re.S)
        v = re.search(r'<v>(.*?)</v>', corpo, re.S)
        if v is None:
            val = None
        elif v.group(1) != '':
            val = v.group(1)
        else:
            val = '' if re.search(r'\bt="(str|inlineStr)"', attrs) else None
        yield m.group(1), _desescapa(f.group(1)) if f else '', val


def contar(caminho, colunas_por_aba: dict | None = None) -> dict:
    res = {}
    with zipfile.ZipFile(str(caminho)) as z:
        for aba, arq in _abas(z).items():
            if arq not in z.namelist():
                continue
            cols = (colunas_por_aba or {}).get(aba)
            xml = z.read(arq).decode('utf-8', 'replace')
            tot = sem = sem_calculavel = 0
            for col, f, v in _celulas_formula(xml):
                if cols is not None and col not in cols:
                    continue
                tot += 1
                if v is None:
                    sem += 1
                    if not NAO_CALCULAVEIS.search(f):
                        sem_calculavel += 1
            if tot:
                res[aba] = {'formulas': tot, 'sem_valor': sem, 'sem_valor_calculavel': sem_calculavel}
    return res


def _resumo(c: dict) -> tuple:
    tot = sum(x['formulas'] for x in c.values())
    sem = sum(x['sem_valor'] for x in c.values())
    return tot, sem


def precisa(caminho) -> int:
    c = contar(caminho)
    tot, sem = _resumo(c)
    calc = sum(x['sem_valor_calculavel'] for x in c.values())
    print(f'fórmulas: {tot} · sem valor gravado: {sem} · sem valor e calculáveis: {calc}')
    return 0 if (tot and calc / tot > 0.01) else 1


def _soffice() -> str | None:
    for c in (os.environ.get('SOFFICE_PATH'), shutil.which('soffice'),
              shutil.which('libreoffice'), '/usr/bin/soffice'):
        if c and Path(c).exists():
            return c
    return None


_XCU = '''<?xml version="1.0" encoding="UTF-8"?>
<oor:items xmlns:oor="http://openoffice.org/2001/registry" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<item oor:path="/org.openoffice.Setup/L10N"><prop oor:name="ooSetupSystemLocale" oor:op="fuse"><value>pt-BR</value></prop></item>
<item oor:path="/org.openoffice.Setup/L10N"><prop oor:name="ooLocale" oor:op="fuse"><value>pt-BR</value></prop></item>
<item oor:path="/org.openoffice.Office.Calc/Formula/Load"><prop oor:name="OOXMLRecalcMode" oor:op="fuse"><value>0</value></prop></item>
</oor:items>
'''


def recalcular(caminho, timeout=900) -> int:
    caminho = Path(caminho)
    soffice = _soffice()
    if not soffice:
        print('ERRO: LibreOffice não encontrado.')
        return 2
    tmp = Path(tempfile.mkdtemp(prefix='recalc_'))
    try:
        perfil = tmp / 'perfil'
        (perfil / 'user').mkdir(parents=True)
        # OOXMLRecalcMode = 0: recalcular SEMPRE ao abrir. Sem isso o
        # LibreOffice pode confiar nos valores gravados — que aqui não existem.
        (perfil / 'user' / 'registrymodifications.xcu').write_text(_XCU, encoding='utf-8')
        entrada = tmp / caminho.name
        shutil.copy2(caminho, entrada)
        saida = tmp / 'saida'
        saida.mkdir()
        env = dict(os.environ, LANG='pt_BR.UTF-8', LC_ALL='pt_BR.UTF-8', LANGUAGE='pt_BR')
        r = subprocess.run(
            [soffice, f'-env:UserInstallation={perfil.as_uri()}', '--headless', '--norestore',
             '--invisible', '--convert-to', 'xlsx:Calc MS Excel 2007 XML',
             '--outdir', str(saida), str(entrada)],
            capture_output=True, timeout=timeout, env=env)
        gerado = saida / (entrada.stem + '.xlsx')
        if not gerado.exists() or gerado.stat().st_size < 1024:
            print('ERRO: o LibreOffice não gerou o arquivo.', r.stderr[:400])
            return 3
        with zipfile.ZipFile(gerado) as z:
            if 'xl/workbook.xml' not in z.namelist():
                print('ERRO: resultado não é um xlsx.')
                return 3
        antes = _resumo(contar(caminho))
        depois = _resumo(contar(gerado))
        shutil.copy2(gerado, caminho)
        print(f'recalculado: sem valor {antes[1]} -> {depois[1]} (de {depois[0]} fórmulas)')
        return 0
    except subprocess.TimeoutExpired:
        print(f'ERRO: recálculo passou de {timeout}s.')
        return 4
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _coluna_numerica(z, arq, coluna) -> tuple:
    """Quantas fórmulas da coluna têm valor numérico, e quantas têm valor."""
    xml = z.read(arq).decode('utf-8', 'replace')
    num = tot = 0
    for col, _, v in _celulas_formula(xml):
        if col != coluna or v is None:
            continue
        tot += 1
        try:
            float(v); num += 1
        except ValueError:
            pass
    return num, tot


def validar(caminho) -> int:
    c = contar(caminho)
    cc = contar(caminho, CRITICAS_FIXAS)
    problemas = []
    criticas = [a for a in cc if a in CRITICAS_FIXAS or PADRAO_CONTRATO.match(a)]
    for aba in criticas:
        x = cc[aba]
        if x['sem_valor_calculavel'] > 0:
            problemas.append(f'{aba}: {x["sem_valor_calculavel"]} de {x["formulas"]} fórmulas sem valor')
    with zipfile.ZipFile(str(caminho)) as z:
        abas = _abas(z)
        # Deflator do bezerro: é ele que denuncia recálculo com idioma errado.
        if 'S.H BEZERRO' in abas:
            num, tot = _coluna_numerica(z, abas['S.H BEZERRO'], 'D')
            if tot and num / tot < 0.95:
                problemas.append(f'S.H BEZERRO, deflator: só {num} de {tot} valores numéricos '
                                 '(sinal de recálculo com datas lidas no idioma errado)')
    tot, sem = _resumo(c)
    print(f'validação: {len(criticas)} abas críticas · {tot} fórmulas · {sem} sem valor no total')
    if problemas:
        print('REPROVADA. A planilha NÃO deve ser publicada:')
        for p in problemas[:30]:
            print('  -', p)
        return 1
    print('APROVADA.')
    return 0


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] not in ('precisa', 'recalcular', 'validar'):
        print('uso: recalcular_dados.py {precisa|recalcular|validar} <dados.xlsx>')
        raise SystemExit(64)
    acao, arq = sys.argv[1], sys.argv[2]
    raise SystemExit({'precisa': precisa, 'recalcular': recalcular, 'validar': validar}[acao](arq))
