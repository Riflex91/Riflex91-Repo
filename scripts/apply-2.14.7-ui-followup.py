from pathlib import Path

p=Path('bot.js')
s=p.read_text(encoding='utf-8')

old="""  var v2147ToolDefsBase=toolDefs;
  toolDefs=function(){
    return v2147ToolDefsBase().map(function(row){
      if(row&&row[0]==='merchant'){
        row=row.slice();
        row[2]=C.language==='de'?'Merchant-Einstellungen':'Merchant settings';
        row[3]=C.language==='de'?'Merchant-Verhalten und Elixiere':'Merchant behavior and elixirs';
      }
      return row;
    });
  };

"""
assert old in s
s=s.replace(old,'',1)

assert "'Merchant & Elixirs','Merchant stand automation'" in s
assert "'Merchant & Elixiere','Merchant-Stand-Automatisierung'" in s
s=s.replace("'Merchant & Elixirs','Merchant stand automation'","'Merchant settings','Merchant stand automation'",1)
s=s.replace("'Merchant & Elixiere','Merchant-Stand-Automatisierung'","'Merchant-Einstellungen','Merchant-Stand-Automatisierung'",1)

p.write_text(s,encoding='utf-8')
print('2.14.7 UI follow-up applied')
