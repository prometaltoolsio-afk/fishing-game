(() => {
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const W=1200,H=650,groundY=520;
const $=id=>document.getElementById(id);
let level=0,health=100,coins=250,selected="archer",paused=false,ended=false;
let enemies=[],shots=[],particles=[],spawned=0,spawnTimer=0,aim=null,last=0;
const costs={archer:50,knight:75,cannon:100};
const names={archer:"Archer",knight:"Knight",cannon:"Cannon"};
const rand=(a,b)=>a+Math.random()*(b-a);
function config(){return LEVELS[Math.min(level,LEVELS.length-1)]}
function startLevel(){enemies=[];shots=[];particles=[];spawned=0;spawnTimer=1;ended=false;health=Math.max(health,1);$("level").textContent=level+1;hideOverlay()}
function updateHUD(){$("health").textContent=health;$("coins").textContent=coins}
function showOverlay(title,msg,button){$("overlayTitle").textContent=title;$("overlayText").textContent=msg;$("overlayBtn").textContent=button;$("overlay").classList.remove("hidden")}
function hideOverlay(){$("overlay").classList.add("hidden")}
function nextLevel(){level++;if(level>=LEVELS.length)level=0;coins+=config().reward;startLevel();updateHUD()}
function selectUnit(unit){selected=unit;document.querySelectorAll(".unit").forEach(b=>b.classList.toggle("active",b.dataset.unit===unit));$("selectedName").textContent=names[unit]+" selected"}
document.querySelectorAll(".unit").forEach(b=>b.addEventListener("click",()=>selectUnit(b.dataset.unit)));
$("pauseBtn").addEventListener("click",()=>{if(ended)return;paused=!paused;if(paused)showOverlay("Paused","গেম থামানো হয়েছে।","Continue");else hideOverlay()});
$("overlayBtn").addEventListener("click",()=>{if(health<=0){health=100;level=0;coins=250;startLevel();updateHUD()}else if(ended){nextLevel()}else{paused=false;hideOverlay()}});
function pos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
canvas.addEventListener("pointerdown",e=>{if(paused||ended)return;canvas.setPointerCapture(e.pointerId);aim=pos(e)});
canvas.addEventListener("pointermove",e=>{if(aim)aim.to=pos(e)});
canvas.addEventListener("pointerup",e=>{if(aim){aim.to=pos(e);}});
$("fireBtn").addEventListener("click",fire);
function fire(){
 if(paused||ended)return;
 const cost=costs[selected];if(coins<cost){$("selectedName").textContent="Not enough coins!";return}
 let target=aim&&aim.to?aim.to:{x:850,y:360};let origin={x:390,y:selected==="cannon"?380:255};
 let dx=origin.x-target.x,dy=origin.y-target.y;
 let power=Math.min(18,Math.max(7,Math.hypot(dx,dy)/18));
 let speed=selected==="cannon"?power*1.2:power*1.55;
 shots.push({x:origin.x,y:origin.y,vx:dx/Math.max(1,Math.hypot(dx,dy))*speed,vy:dy/Math.max(1,Math.hypot(dx,dy))*speed,type:selected,r:selected==="cannon"?13:5,damage:selected==="cannon"?58:selected==="knight"?25:22});
 coins-=cost;updateHUD();aim=null;
}
function spawnEnemy(){const c=config();if(spawned>=c.enemies)return;enemies.push({x:1110,y:groundY-35,hp:c.enemyHP,max:c.enemyHP,speed:c.speed*(spawned%4===3?1.2:1),size:spawned%4===3?1.25:1,kind:spawned%4===3?"brute":"goblin",hit:0});spawned++}
function burst(x,y){for(let i=0;i<9;i++)particles.push({x,y,vx:rand(-2.5,2.5),vy:rand(-3,1),life:30})}
function update(dt){
 if(paused||ended)return;
 spawnTimer-=dt;if(spawnTimer<=0&&spawned<config().enemies){spawnEnemy();spawnTimer=1.9}
 for(const en of enemies){en.x-=en.speed*dt*60;if(en.hit>0)en.hit--}
 for(const s of shots){s.x+=s.vx*dt*60;s.y+=s.vy*dt*60;s.vy+=0.18*dt*60;
  for(const en of enemies){if(en.hp>0&&Math.hypot(s.x-en.x,s.y-(en.y-10))<35*en.size){en.hp-=s.damage;en.hit=8;burst(s.x,s.y);s.dead=true;break}}
  if(s.x>W||s.y>H||s.x<0)s.dead=true;
 }
 shots=shots.filter(s=>!s.dead);
 enemies=enemies.filter(en=>{if(en.hp<=0){coins+=12;burst(en.x,en.y);return false}if(en.x<470){health-=Math.ceil(7*en.size);burst(470,en.y);return false}return true});
 for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.life--}particles=particles.filter(p=>p.life>0);
 if(health<=0){health=0;ended=true;showOverlay("Castle Fallen!","আবার চেষ্টা করো।","Restart")}
 if(spawned===config().enemies&&enemies.length===0&&!ended){ended=true;showOverlay("Level Complete!","দারুণ! পরের লেভেলে আরও কঠিন শত্রু আসবে।","Next Level")}
 updateHUD();
}
function drawBackground(){
 const sky=ctx.createLinearGradient(0,0,0,groundY);sky.addColorStop(0,"#39a9ef");sky.addColorStop(1,"#c8efff");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 // clouds
 ctx.fillStyle="#fff";for(const [x,y,r] of [[180,100,35],[230,95,45],[280,110,30],[780,115,35],[830,95,48],[880,116,30]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
 // mountains and forest
 ctx.fillStyle="#6b9fd0";for(let x=480;x<1200;x+=210){ctx.beginPath();ctx.moveTo(x,groundY);ctx.lineTo(x+110,235+((x/210)%2)*60);ctx.lineTo(x+220,groundY);ctx.fill()}
 for(let x=450;x<1200;x+=34){ctx.fillStyle=x%2?"#176c50":"#23865a";ctx.beginPath();ctx.moveTo(x,groundY);ctx.lineTo(x+18,360+Math.sin(x)*20);ctx.lineTo(x+36,groundY);ctx.fill()}
 ctx.fillStyle="#75c93d";ctx.fillRect(0,groundY,W,H-groundY);
 ctx.fillStyle="#d9b36a";ctx.beginPath();ctx.moveTo(0,groundY+30);ctx.quadraticCurveTo(600,groundY-5,1200,groundY+35);ctx.lineTo(1200,groundY+75);ctx.quadraticCurveTo(600,groundY+38,0,groundY+75);ctx.fill();
}
function castle(){
 ctx.fillStyle="#a9b4bf";ctx.fillRect(0,300,425,220);ctx.fillStyle="#d8dce0";ctx.fillRect(15,255,390,265);
 // battlements
 for(let x=15;x<420;x+=48){ctx.fillStyle="#c5cdd3";ctx.fillRect(x,235,32,35)}
 // towers
 for(const x of [20,305]){ctx.fillStyle="#bfc8d0";ctx.fillRect(x,170,105,350);ctx.fillStyle="#e0e5e8";ctx.fillRect(x-8,160,121,24);ctx.fillStyle="#bd3128";ctx.beginPath();ctx.moveTo(x-8,160);ctx.lineTo(x+52,65);ctx.lineTo(x+113,160);ctx.fill()}
 ctx.fillStyle="#713d24";ctx.fillRect(135,400,110,120);ctx.beginPath();ctx.arc(190,400,55,Math.PI,0);ctx.fill();ctx.fillStyle="#d49a4c";ctx.fillRect(185,460,5,8);
 ctx.fillStyle="#f6d44d";ctx.fillRect(65,300,52,72);ctx.fillStyle="#214d9b";ctx.font="bold 42px serif";ctx.fillText("⚜",70,350);
 // archer / cannon / knight
 ctx.font="42px serif";ctx.fillText("🏹",245,250);ctx.fillText("🛡️",235,420);ctx.fillText("💣",360,365);
}
function drawEnemy(en){ctx.save();ctx.translate(en.x,en.y);ctx.scale(en.size,en.size);ctx.fillStyle=en.hit?"#fff":"#5dba35";ctx.beginPath();ctx.arc(0,-18,22,0,Math.PI*2);ctx.fill();ctx.fillStyle="#244a20";ctx.fillRect(-17,0,34,35);ctx.fillStyle="#fff";ctx.fillRect(-12,-23,7,7);ctx.fillRect(6,-23,7,7);ctx.fillStyle="#222";ctx.fillRect(-8,-5,16,4);ctx.fillStyle="#65432a";ctx.fillRect(-24,5,10,28);ctx.fillRect(14,5,10,28);ctx.fillStyle="#e8e8e8";ctx.fillRect(-24,-3,9,7);ctx.fillRect(15,-3,9,7);
 if(en.kind==="brute"){ctx.fillStyle="#8b5b28";ctx.fillRect(-27,-42,54,12);ctx.font="22px serif";ctx.fillText("👹",-17,-35)}
 ctx.fillStyle="#222";ctx.fillRect(-23,-58,46,6);ctx.fillStyle="#ffdf42";ctx.fillRect(-23,-58,46*Math.max(0,en.hp/en.max),6);ctx.restore()}
function draw(){
 drawBackground();castle();
 // enemy watch tower
 ctx.fillStyle="#8a5529";ctx.fillRect(1080,220,90,300);ctx.fillRect(1060,210,130,18);ctx.fillStyle="#b87b3c";ctx.fillRect(1070,190,110,30);ctx.font="40px serif";ctx.fillText("☠",1105,270);
 enemies.forEach(drawEnemy);
 shots.forEach(s=>{ctx.fillStyle=s.type==="cannon"?"#222":"#f6e3a1";ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();if(s.type==="cannon"){ctx.fillStyle="#ff9c32";ctx.beginPath();ctx.arc(s.x-5,s.y-5,4,0,Math.PI*2);ctx.fill()}});
 particles.forEach(p=>{ctx.fillStyle="#ffd34e";ctx.globalAlpha=p.life/30;ctx.fillRect(p.x,p.y,5,5);ctx.globalAlpha=1});
 if(aim&&aim.to){ctx.strokeStyle="#fff";ctx.lineWidth=4;ctx.setLineDash([10,10]);ctx.beginPath();ctx.moveTo(390,selected==="cannon"?380:255);ctx.lineTo(aim.to.x,aim.to.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(aim.to.x,aim.to.y,8,0,Math.PI*2);ctx.fill()}
 ctx.fillStyle="#123";ctx.font="bold 23px system-ui";ctx.fillText(config().name,500,40);
}
function loop(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
startLevel();updateHUD();requestAnimationFrame(loop);
})();