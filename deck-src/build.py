#!/usr/bin/env python3
"""Rebuild the generated parts of ../index.html from deck-src/.

Generated regions (do not hand-edit inside index.html, edit deck-src/ instead):
  /* PROCESS-SLIDES:START */ ... /* PROCESS-SLIDES:END */   <- content/process-slides.json + screens/p1..p5.html
  /* TAKEAWAYS:START */ ... /* TAKEAWAYS:END */             <- content/key-takeaways.json
  <style id="process-css">   <- styles/process.css
  <style id="takeaways-css"> <- styles/takeaways.css
  <script id="process-js">   <- scripts/process.js

Usage:  python3 deck-src/build.py          (rebuild)
        python3 deck-src/build.py --check  (validate only: ids, JSON, markers)
Standard library only (Python 3.8+).
"""
import json, re, sys, html as H
from pathlib import Path

SRC = Path(__file__).resolve().parent
ROOT = SRC.parent
INDEX = ROOT / 'index.html'
SPK = '<svg class="spk" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.8 5.6 3.4 8.3 9.5 9.5-6.1 1.2-8.7 3.9-9.5 9.5-.8-5.6-3.4-8.3-9.5-9.5 6.1-1.2 8.7-3.9 9.5-9.5z"/></svg>'

def esc(t): return H.escape(t, quote=False)
def js_str(t): return t.replace('\\', '\\\\').replace('"', '\\"').replace('\n', ' ')
def tpl_safe(t, where):
    if '`' in t or '${' in t: sys.exit(f'ERROR: {where} contains a backtick or ${{ which breaks the slide template. Remove it.')
    return t

def check_ids(p, screens):
    problems = []
    groups = p['pins'].values() if p['mode'] == 'roles' else [p['pins']]
    for grp in groups:
        for n, pin in grp.items():
            if f'id="{pin["el"]}"' not in screens and f"id={pin['el']}" not in screens:
                problems.append(f'process {p["n"]}: pin {n} points to id "{pin["el"]}" which is not in {p["screens"]}')
            if not n.isdigit() or not (1 <= int(n) <= len(p['attributes'])):
                problems.append(f'process {p["n"]}: pin key "{n}" must be an attribute number 1..{len(p["attributes"])}')
    return problems

def process_slide(p):
    screens = (SRC / p['screens']).read_text(encoding='utf-8')
    screens = re.sub(r'<!--.*?-->', '', screens, flags=re.S).strip()
    li = ''.join(f'<li data-n="{k+1}"><span class="bu"><b>{k+1}</b></span><div class="tx"><b class="t">{esc(a["title"])}</b>'
                 f'<span class="pp">{esc(a["principles"])}</span></div></li>' for k, a in enumerate(p['attributes']))
    if p['mode'] == 'roles':
        top = '<div class="wf-roles">' + ''.join(f'<button data-role="{r["id"]}"><img src="{r["icon"]}" alt=""><span>{esc(r["label"])}</span></button>' for r in p['roles']) + '</div>'
        cfg = {r['id']: p['pins'].get(r['id'], {}) for r in p['roles']}
    else:
        top = ''
        cfg = {k: dict(v, s=p.get('captions', {}).get(k, '')) for k, v in p['pins'].items()}
    c = H.escape(json.dumps(cfg, ensure_ascii=False), quote=True)
    alt = esc(p.get('title_for_alt', ''))
    html = (f'<div class="wf-grid2"><div class="wf-left"><div class="wf-eb">{p["n"]} of 5 processes</div>'
            f'<img class="wf-sk" src="{p["sketch"]}" alt="Hand-drawn sketch: {alt}"><div class="wf-sub">Supporting attributes</div><ol class="wf-attrs">{li}</ol></div>'
            f'<div class="wf-right">{top}<div class="wf-band"><div class="wf-cap"><span class="spkc sm">{SPK}</span><span class="capt"></span></div><div class="tipb"><div class="tt"><b></b><p></p></div><em></em><i class="arr"></i></div></div>'
            f'<div class="wf-stage" data-mode="{p["mode"]}" data-cfg="{c}"><div class="wf-scale">{screens}'
            f'<div class="wf-clip"><i class="wf-hl"></i></div><div class="wf-pins"></div></div><div class="wf-tip2"><b></b><p></p><em></em><i class="arr"></i></div></div></div></div>')
    tpl_safe(html, f'process {p["n"]}')
    return "{h:'raw', cls:'cs wfs', notes:\"" + js_str(p['speaker_notes']) + "\", html:`" + html + "`},\n", check_ids(p, screens)

def takeaways(k):
    cards = ''.join(f'<div class="kt-card" style="--r:{c.get("tilt_deg",0)}deg;--x:0"><img src="{c["src"]}" alt="{esc(c.get("alt",""))}"></div>' for c in k['step_cards'])
    prin = ''.join(f'<li>{esc(x)}</li>' for x in k['principles'])
    cta = k['cta']
    html = (f'\n <div class="kt-head"><h2 class="display">{esc(k["title"])}</h2></div>\n <div class="kt-grid">\n'
            f'  <div class="kt-steps">{cards}</div>\n'
            f'  <div class="kt-mid"><img class="kt-art" src="{k["sketch_slot"]["src"]}" alt="{esc(k["sketch_slot"].get("alt",""))}"><blockquote class="kt-quote">{esc(k["quote"])}</blockquote><div class="kt-by">{esc(k["byline"])}</div></div>\n'
            f'  <div class="kt-prin"><div class="kt-ph">{esc(k["principles_heading"])}</div><ul>{prin}</ul></div>\n </div>\n'
            f' <a class="kt-cta" href="{H.escape(cta["url"], quote=True)}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><span><b>{esc(cta["title"])}</b><em>{esc(cta["subtitle"])}</em></span><i>&rarr;</i></a>')
    tpl_safe(html, 'key-takeaways')
    return "{h:'raw', cls:'cs kt', notes:\"" + js_str(k['speaker_notes']) + "\", html:`" + html + "`},\n"

def replace_between(s, start, end, body, label):
    if start not in s or end not in s: sys.exit(f'ERROR: marker for {label} missing in index.html ({start})')
    a = s.index(start) + len(start); b = s.index(end, a)
    return s[:a] + '\n' + body + s[b:]

def replace_tag(s, open_tag, close_tag, body, label):
    if open_tag not in s: sys.exit(f'ERROR: {open_tag} missing in index.html ({label})')
    a = s.index(open_tag) + len(open_tag); b = s.index(close_tag, a)
    return s[:a] + '\n' + body + '\n' + s[b:]

def main():
    check = '--check' in sys.argv
    pdoc = json.loads((SRC / 'content/process-slides.json').read_text(encoding='utf-8'))
    kdoc = json.loads((SRC / 'content/key-takeaways.json').read_text(encoding='utf-8'))
    slides, problems = '', []
    for p in pdoc['processes']:
        js, pr = process_slide(p); slides += js; problems += pr
    for img in [p['sketch'] for p in pdoc['processes']] + [c['src'] for c in kdoc['step_cards']] + [kdoc['sketch_slot']['src']]:
        if not (ROOT / img).exists(): problems.append(f'missing image file: {img}')
    if problems:
        print('\n'.join('PROBLEM: ' + x for x in problems)); sys.exit(1)
    if check:
        print('OK: content, screens and images are consistent.'); return
    s = INDEX.read_text(encoding='utf-8')
    s = replace_between(s, '/* PROCESS-SLIDES:START */', '/* PROCESS-SLIDES:END */', slides, 'process slides')
    s = replace_between(s, '/* TAKEAWAYS:START */', '/* TAKEAWAYS:END */', takeaways(kdoc), 'takeaways')
    s = replace_tag(s, '<style id="process-css">', '</style>', (SRC / 'styles/process.css').read_text(encoding='utf-8'), 'process css')
    s = replace_tag(s, '<style id="takeaways-css">', '</style>', (SRC / 'styles/takeaways.css').read_text(encoding='utf-8'), 'takeaways css')
    s = replace_tag(s, '<script id="process-js">', '</script>', (SRC / 'scripts/process.js').read_text(encoding='utf-8'), 'process js')
    INDEX.write_text(s, encoding='utf-8')
    print('Built index.html from deck-src/.')

if __name__ == '__main__':
    main()
