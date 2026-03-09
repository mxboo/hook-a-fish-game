// 检查 GLB 文件结构
const fs = require('fs');

async function analyzeGLB(filepath) {
  try {
    const { GLTFLoader } = await import('three-stdlib');
    const THREE = await import('three');
    
    const loader = new GLTFLoader();
    const data = fs.readFileSync(filepath);
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    
    loader.parse(arrayBuffer, '', (gltf) => {
      console.log('\n=== ' + filepath + ' ===');
      console.log('场景数:', gltf.scenes.length);
      console.log('节点数:', gltf.nodes.length);
      console.log('网格数:', gltf.meshes.length);
      console.log('材质数:', gltf.materials.length);
      
      console.log('\n节点列表:');
      gltf.nodes.forEach((node, i) => {
        console.log(`  [${i}] ${node.name || 'unnamed'} - ${node.type || 'Group'}`);
      });
      
      console.log('\n材质列表:');
      gltf.materials.forEach((mat, i) => {
        console.log(`  [${i}] ${mat.name || 'unnamed'} - ${mat.type}`);
      });
    });
  } catch (error) {
    console.error('错误:', error.message);
  }
}

analyzeGLB('./fish.glb');
analyzeGLB('./fish2.glb');
