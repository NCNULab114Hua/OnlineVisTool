const toTop=document.querySelector(".to-top");//https://developer.mozilla.org/zh-TW/docs/Web/API/Document/querySelector

window.addEventListener("scroll",()=>
{
if(window.pageYOffset>100)
{
    toTop.classList.add("active");
}
else
{
    toTop.classList.remove("active");
}
})