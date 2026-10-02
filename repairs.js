import * as T from 'three';

function group(parent){
  const g=new T.Group();g.name='reconstruction-hologram';g.visible=false;
  g.userData.pulseMaterials=[];g.userData.reveal=0;g.userData.targetReveal=0;
  parent.add(g);return g;
}
function surface(g,geometry,color){
  const material=new T.MeshStandardMaterial({color,roughness:.83,metalness:.06,transparent:true,opacity:0,depthWrite:false,side:T.FrontSide});
  // Surface shading, a soft silhouette and fine scan bands replace polygon wireframes.
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vRepairPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRepairPosition=position;');
    shader.fragmentShader='varying vec3 vRepairPosition;\n'+shader.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
      float rim=pow(1.0-abs(dot(normalize(normal),normalize(vViewPosition))),2.6);
      float band=pow(0.5+0.5*sin(vRepairPosition.y*116.0),16.0);
      float grain=sin(dot(vRepairPosition,vec3(391.7,157.1,289.3)))*sin(dot(vRepairPosition,vec3(149.3,317.9,173.1)));
      gl_FragColor.rgb*=1.0+grain*0.035;
      gl_FragColor.rgb+=vec3(0.055+0.19*rim+0.018*band);
      gl_FragColor.a*=0.89+0.11*rim;
    `);
  };
  material.customProgramCacheKey=()=> 'stone-repair-surface-v2';
  const mesh=new T.Mesh(geometry,material);mesh.name='repair-surface';mesh.raycast=()=>{};mesh.castShadow=false;mesh.receiveShadow=true;g.add(mesh);
  g.userData.pulseMaterials.push({material,opacity:.58});return mesh;
}
export function buildStoneRepair(parent){
  const g=group(parent),s=new T.Shape();
  // Restore a rounded stela crown, following the existing fracture exactly.
  const broken=[[99,174],[108,149],[180,105],[224,78],[279,54],[312,23],[354,17],[372,31]];
  const points=broken.map(([x,y])=>[(x-243)*.0093,(233-y)*.0093]);
  s.moveTo(...points[0]);s.lineTo(-1.43,2.42);
  s.bezierCurveTo(-1.43,3.17,-.78,3.69,0,3.69);
  s.bezierCurveTo(.78,3.69,1.44,3.17,1.44,2.42);
  s.lineTo(...points[points.length-1]);
  for(let i=points.length-2;i>=0;i--)s.lineTo(...points[i]);
  s.closePath();
  const geo=new T.ExtrudeGeometry(s,{depth:.56,steps:1,curveSegments:48,bevelEnabled:true,bevelThickness:.045,bevelSize:.019,bevelSegments:3});
  geo.translate(0,0,-.28);
  // Flat slab faces with smooth bevels; no stretched triangular surface patches.
  geo.translate(0,-.012,0);geo.computeVertexNormals();
  const p=geo.attributes.position,n=geo.attributes.normal,shared=new Map(),keys=[],sideStart=geo.groups.find(part=>part.materialIndex===1)?.start||0;
  for(let i=0;i<p.count;i++){
    const key=(i<sideStart?'cap:':'side:')+[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');keys.push(key);
    const sum=shared.get(key)||new T.Vector3();sum.add(new T.Vector3(n.getX(i),n.getY(i),n.getZ(i)));shared.set(key,sum);
  }
  for(const sum of shared.values())sum.normalize();
  for(let i=0;i<n.count;i++){const sum=shared.get(keys[i]);n.setXYZ(i,sum.x,sum.y,sum.z)}
  surface(g,geo,'#73746f');
  return g;
}
export function buildVenusRepair(parent){
  const g=group(parent);
  g.userData.ready=fetch('assets/venus-arm-repair.bin').then(r=>{if(!r.ok)throw Error('Arm reconstruction unavailable');return r.arrayBuffer()}).then(buffer=>{
    const [count,indexCount]=new Uint32Array(buffer,0,2),geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,8,count*3),3));
    geo.setAttribute('normal',new T.BufferAttribute(new Float32Array(buffer,8+count*12,count*3),3));
    geo.setIndex(new T.BufferAttribute(new Uint32Array(buffer,8+count*24,indexCount),1));
    geo.computeBoundingBox();geo.computeBoundingSphere();surface(g,geo,'#b7b5ac');
    return g;
  });
  return g;
}
