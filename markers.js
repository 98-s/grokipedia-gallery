import * as T from 'three';
let ringTexture;
function ring(parent,label,position,normal){
  if(!ringTexture){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.beginPath();x.arc(64,64,48,0,Math.PI*2);x.strokeStyle='rgba(0,0,0,.82)';x.lineWidth=15;x.shadowColor='rgba(0,0,0,.95)';x.shadowBlur=9;x.shadowOffsetY=4;x.stroke();x.shadowColor='transparent';x.shadowBlur=0;x.shadowOffsetY=0;x.strokeStyle='#ffffff';x.lineWidth=8;x.stroke();ringTexture=new T.CanvasTexture(c)}
  const mark=new T.Sprite(new T.SpriteMaterial({map:ringTexture,transparent:true,depthTest:true,depthWrite:false,sizeAttenuation:false,toneMapped:false,alphaTest:.01}));mark.name='feature-marker';mark.userData.label=label;mark.scale.set(.024,.024,1);mark.position.fromArray(position);mark.renderOrder=10;parent.add(mark);return mark;
}
function surface(model,label,p,from=[0,0,1]){
  model.updateMatrixWorld(true);const origin=model.localToWorld(new T.Vector3(...p).addScaledVector(new T.Vector3(...from),5));const direction=new T.Vector3(...from).negate().transformDirection(model.matrixWorld);const ray=new T.Raycaster(origin,direction),meshes=[];
  model.traverse(o=>{if(o.isMesh&&!o.material.transparent)meshes.push(o)});const hit=ray.intersectObjects(meshes,false)[0];let position=new T.Vector3(...p);
  if(hit){const n=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);position=model.worldToLocal(hit.point.clone().addScaledVector(n,.045))}
  return ring(model,label,position.toArray());
}
export function attachMarkers(i,m){
  let rings=[];
  if(i===0)rings=[surface(m,'Top band of hieroglyphs',[.34,.96,.34]),surface(m,'Middle Demotic section',[-.21,.03,.34]),surface(m,'Broken edge',[-.58,1.1,.34])];
  if(i===1)rings=[surface(m,'Nozzle',[0,-1.55,.9]),surface(m,'Turbopumps',[.07,1.20,.55]),surface(m,'Propellant lines',[.86,1.10,.30])];
  if(i===2)rings=[surface(m,'Missing arm',[-.52,.99,.35]),surface(m,'Base (with inscription)',[-.07,-2.36,.67]),surface(m,'Drapery',[.13,-.63,.55])];
  if(i===3)rings=[ring(m,'Wing warping cables',[2.60,.465,.48]),ring(m,'Long skids',[.5,-.315,1.30]),ring(m,'Canard elevators',[.48,.76,1.94])];
  if(i===4){const page=ring(m,'Page',[.77,-.025,.38]),cover=ring(m.userData.hinge,'Cover',[.80,.345,-.48]),text=ring(m,'Words / text',[.31,.157,-.15]);rings=[page,cover,text];return {rings,update(){const open=m.userData.open;page.position.set(open>.5?-.34:.79,open>.5?.158:-.025,.62);text.visible=open>.62}}}
  if(i===5){const [w,h]=m.userData.artSize;for(const [label,u,v] of [['Cross-shaped raft',.39,.91],['Rising sun',.612,.489],['Wave crest',.49,.662]])rings.push(ring(m,label,[(u-.5)*w,(.5-v)*h,.13]))}
  return {rings,update(){}};
}
