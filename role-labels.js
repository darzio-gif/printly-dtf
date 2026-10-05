(function(){
  const labels={
    'Designer':'Infographe',
    'Print Operator':'Opérateur',
    'Staff':'Commercial',
    'designer':'Infographe',
    'print_operator':'Opérateur',
    'staff':'Commercial',
    'infographe':'Infographe',
    'operateur':'Opérateur',
    'commercial':'Commercial'
  };

  function apply(){
    document.querySelectorAll('select option').forEach(option=>{
      const key=option.value;
      if(labels[key]) option.textContent=labels[key];
      else if(labels[option.textContent.trim()]) option.textContent=labels[option.textContent.trim()];
    });

    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const value=node.nodeValue;
      const trimmed=value.trim();
      if(labels[trimmed]) node.nodeValue=value.replace(trimmed,labels[trimmed]);
    });
  }

  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply()});
  }

  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();
