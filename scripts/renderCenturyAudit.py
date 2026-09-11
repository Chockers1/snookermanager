"""Render measured evidence only; interpretation is authored separately after review."""
import json,csv,collections,pathlib,sys
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'artifacts/century-20260911/report')
data=json.loads((root/'summary.json').read_text(encoding='utf-8'))
s=data['summary']; years=data['seasons']; life=json.loads((root/'life-summary.json').read_text(encoding='utf-8'))
flags=list(csv.DictReader((root/'findings.csv').open(encoding='utf-8')))
counts=collections.Counter(x['Check'] for x in flags)
lines=[f"# {s['seasons']}-season audit: measured results",'',f"Completed annual records: **{s['seasons']}**. Dates: **{s['firstDate']} to {s['lastDate']}**.",'']
def table(headers,rows):
 lines.append('| '+' | '.join(headers)+' |');lines.append('| '+' | '.join('---' for _ in headers)+' |')
 for row in rows:lines.append('| '+' | '.join(str(v if v is not None else '—').replace('|','/') for v in row)+' |')
 lines.append('')
def n(v):return f'{v:,.0f}' if isinstance(v,(int,float)) else '—'
lines+=['## Coverage','']
table(['Measure','Observed'],[(k,n(s[v])) for k,v in [('Seasons','seasons'),('Expected events','expectedEvents'),('Recorded events','completedEvents'),('Scored singles bracket matches','scoredMatches'),('New named players','namedNewcomers'),('CPU retirements','totalRetirements'),('Q School/playoff awarded places checked','namedQualifications')]])
lines+=['## Recorded integrity checks','']
table(['Check','Flags'],[(k,n(v)) for k,v in s['rawIssuesByKind'].items()]+[(k,n(s[v])) for k,v in [('Unregistered entrant appearances','fillerEntries'),('Anonymous champions','anonymousChampions'),('Age eligibility','ageViolations'),('Earned qualifying places missing next card','missingCards'),('CPU season records differing from completed brackets','cpuRecordArithmeticRows'),('CPU major counter shortfalls','cpuMajorCounterRows'),('Active CPU records with zero highest break','cpuZeroBreakRows')]])
lines+=['## Derived findings','']
table(['Check','Records'],counts.most_common())
for kind,count in counts.most_common():
 lines += ['### '+kind,'',f'{count} flagged records. First examples:','']
 for f in [x for x in flags if x['Check']==kind][:3]:lines.append('- '+f['Season']+': '+f['Evidence'])
 lines.append('')
lines+=['## Generations and champions','',f"World champion age: {s['youngestChampionAge']}–{s['oldestChampionAge']}; mean {s['meanChampionAge']:.1f}. Tour cards at rollover: {s['cardHoldersMin']}–{s['cardHoldersMax']}.",'']
table(['World champion','Wins'],s['worldChampions'])
table(['Closing number one','Seasons'],s['numberOnes'])
lines+=['## Every season','']
table(['Season','Events','World champion (age)','No. 1','Active players','New / retired','Cards'],[(y['season'],str(y['events'])+'/'+str(y['expected']),str(y['champion'])+' ('+str(y['championAge'])+')',y['top'][0]['playerName'] if y['top'] else '—',y['active'],str(y['newcomers'])+' / '+str(y['retirements']),y['cards']) for y in years])
lines+=['## Managed career','']
table(['Season','Age next opening','Matches','W–L','Titles','Prize','Closing cash','World rank','Tour card','Retired'],[(y['season'],y['human']['age'],(y['human'].get('record') or {}).get('matchesPlayed'),str((y['human'].get('record') or {}).get('wins','—'))+'–'+str((y['human'].get('record') or {}).get('losses','—')),(y['human'].get('record') or {}).get('titles'),n((y['human'].get('record') or {}).get('prizeMoney')),n(y['human']['closingCash']),y['human']['card'].get('worldRank'),y['human']['card'].get('hasTourCard'),y['human']['retired']) for y in years])
lines+=['## New seasonal systems','']
table(['Measure','Observed'],[(k,n(life[k])) for k in ['acceptedTeams','completedTeams','rubbers','doubles','uniqueStories','uniqueInterviews','staffHistory']])
table(['Story type','Observed'],collections.Counter(x.get('kind','archive-only') for x in life['stories']).most_common())
table(['Season','Check','Evidence'],[(f['season'],f['kind'],f['detail']) for f in life['flags']])
lines+=['## Runtime and retained state','']
table(['Season','Seconds','Heap MB','Form evidence rows','Detailed / archived stories','Partners','Retained ledger rows'],[(r['season'],round(r['seconds'],1),r['heapMb'],r['formEvidence'],str(r['stories'])+' / '+str(r['archivedStories']),r['partnerships'],r['ledgerRows']) for r in life['rows']])
lines+=['## Evidence files','',*[f'- [{x.name}]({x.resolve().as_posix()})' for x in root.glob('*.csv')],'','Statistics describe this seeded configured-game run. Missing retained financial transactions, choice branches not selected, UI behaviour and real-world rules require separate verification. Detailed interpretation and reproduction information accompany this data report.','']
(root/'measured-results.md').write_text('\n'.join(lines),encoding='utf-8')
print(root/'measured-results.md')
