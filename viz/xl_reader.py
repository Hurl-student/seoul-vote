import zipfile,re,sys
import xml.etree.ElementTree as ET
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def col(ref):
    s=re.match(r'[A-Z]+',ref).group(); n=0
    for c in s: n=n*26+ord(c)-64
    return n-1
def read(path):
    z=zipfile.ZipFile(path)
    ss=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',NS):
            ss.append(''.join(t.text or '' for t in si.iter('{%s}t'%NS['m'])))
    wb=ET.fromstring(z.read('xl/workbook.xml'))
    sheets=[s.get('name') for s in wb.find('m:sheets',NS)]
    out={}
    for i,name in enumerate(sheets,1):
        rows=[]
        sh=ET.fromstring(z.read(f'xl/worksheets/sheet{i}.xml'))
        for r in sh.iter('{%s}row'%NS['m']):
            row={}
            for c in r.findall('m:c',NS):
                v=c.find('m:v',NS); t=c.get('t')
                if t=='inlineStr': val=''.join(x.text or '' for x in c.iter('{%s}t'%NS['m']))
                elif v is None: continue
                elif t=='s': val=ss[int(v.text)]
                else: val=v.text
                row[col(c.get('r'))]=val
            rows.append(row)
        out[name]=rows
    return out
