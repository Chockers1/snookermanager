import json,pathlib,re
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
root=pathlib.Path('artifacts/century-20260911/report')
d=json.loads((root/'summary.json').read_text());rows=d['seasons'];life=json.loads((root/'life-summary.json').read_text())['rows']
log=pathlib.Path('artifacts/century-20260911/run.log').read_text(encoding='utf-8-sig',errors='replace')
ratings=[(int(a),float(b)) for a,b in re.findall(r'Season (\d+)/100: age \d+, OVR ([\d.]+)',log)]
x=list(range(1,len(rows)+1))
fig,axes=plt.subplots(2,2,figsize=(13,8),constrained_layout=True)
fig.suptitle(f"{len(rows)}-season endurance audit · seed 104729",fontsize=17,fontweight='bold')
a=axes[0,0]
for human,label,color,marker in [(False,'CPU champion','#2166ac','o'),(True,'Managed player champion','#b45309','s')]:
 pts=[(i+1,r['championAge']) for i,r in enumerate(rows) if (r['champion']==r['human']['name'])==human]
 if pts:a.scatter(*zip(*pts),s=25,label=label,color=color,marker=marker)
a.set_title('World champion age during each season');a.set_ylabel('Age');a.legend(fontsize=8)
a=axes[0,1]
if ratings:a.plot(*zip(*ratings),color='#2166ac',label='Managed player overall')
a.plot(x,[r['ratingAverage'] for r in rows],color='#b45309',label='Active CPU roster mean*');a.set_ylim(0,100);a.set_title('Development and ageing');a.set_ylabel('Overall rating');a.legend(fontsize=8)
a=axes[1,0];a.plot(x,[r['active'] for r in rows],label='Active',color='#2166ac');a.plot(x,[r['retired'] for r in rows],label='Archived retired',color='#b45309');a.set_title('World population');a.set_ylabel('Players');a.legend(fontsize=8)
a=axes[1,1];a.plot(range(1,len(life)+1),[r['seconds'] for r in life],color='#2166ac');a.set_title('Observed time per simulated season');a.set_ylabel('Seconds on this audit host')
for a in axes.flat:a.set_xlabel('Season number');a.grid(alpha=.18);a.spines[['top','right']].set_visible(False)
fig.text(.01,-.035,'*Roster mean includes all active pathways and one retained human roster profile. Runtime includes management and audit work; it is not a browser benchmark.',fontsize=8)
fig.savefig(root/'century-overview.png',dpi=160,bbox_inches='tight');plt.close(fig)
