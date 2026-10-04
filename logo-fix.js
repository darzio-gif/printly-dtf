/* Printly logo loader: always resolve the repository logo as an absolute public asset. */
(function(){
  const LOGO='/logo.png?v=20261004-2';
  function fix(){
    document.querySelectorAll('img[src="/logo.png"], img[src="logo.png"]').forEach(img=>{
      if(img.getAttribute('src')!==LOGO){
        img.setAttribute('src',LOGO);
        img.setAttribute('decoding','async');
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix,{once:true});else fix();
  new MutationObserver(fix).observe(document.documentElement,{childList:true,subtree:true});
})();
