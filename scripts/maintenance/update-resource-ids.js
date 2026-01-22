// scripts/update-resource-ids.js
// 将 resources.json 中的字符串 ID 更新为 UUID

const fs = require('fs');
const path = require('path');

// UUID 映射表（保持原有 ID 的顺序）
const idMapping = {
  'coolors-1': 'fd753041-246e-4bcb-ac19-609e8afeef75',
  'adobe-color-2': 'd4f75d9c-a55c-4e26-a9ca-5b07c88f7ce1',
  'colorhunt-3': '735cbcb6-0a99-4067-a05b-66ba81feefea',
  'tailwindcss-4': 'e8ce681b-7701-490a-9c82-9137aa8ad7da',
  'animate-css-5': '1def89eb-2314-41f0-91f0-973b3f3bef07',
  'uiverse-6': '052c4b58-586f-46da-bb2a-bd4ca727d87d',
  'google-fonts-7': 'a31b8bec-4226-4ee1-936f-1abdd90b58b4',
  'fontpair-8': '072d2301-f671-4801-b590-dcd49b89240e',
  'fontsquirrel-9': 'e7bd9da5-a33d-4203-9492-17afa1288af0',
  'lucide-10': '19a8ff93-f658-4658-a798-fd0871879ef4',
  'heroicons-11': '70226f8e-d477-41b3-90de-97846bbafd1f',
  'iconify-12': 'ed4ef348-2c35-4c0c-900b-967fe55e9ec3',
  'dribbble-13': 'b5a7efc4-fb4a-4125-a197-a8c612cf337b',
  'behance-14': '89b75f66-380f-4776-a64c-2273c1f90661',
  'pinterest-15': 'e5d82b9a-9960-4630-ba22-e2516177a7da',
  'awwwards-16': '266f0cc8-6610-43be-a462-60f01e51a4c9',
  'siteinspire-17': '830d915c-9819-4010-924c-cf3cf05e17e8',
  'landbook-18': 'ab84619b-88ba-431e-b045-f7e55b8af4fb',
  'shadcn-ui-19': '926dc96f-4b94-4ae3-adfd-e2592d5b3a01',
  'chakra-ui-20': '02c14df7-39bc-408b-96e8-97b913ebd309',
  'daisyui-21': '5fb4b0ba-6988-4f83-a61f-c05d5c99cc7a',
  'mockuphone-22': '5234f88e-bc13-44be-ace6-f225048db813',
  'smartmockups-23': '388fb949-2551-4ae3-8b6a-5621f9511774',
  'mockup-world-24': '04818fc2-7979-4d06-aa84-c5c96dee3d52',
  'gradient-hunt-25': 'a130b68e-2d32-4641-b5e2-a0c8463c7f40',
  'css-tricks-26': 'fa0479ec-e802-4686-9699-86532c5dd220',
  'fontjoy-27': '6531585b-77df-4423-ae57-91fead5e5a9d',
  'flaticon-28': 'af36250b-6f73-46d1-bf6d-c81180308d0d',
  'mobbin-29': '2c5a3e81-d92a-47f3-8879-db0426fc5d52',
  'ant-design-30': 'ae19165a-f7a5-4067-8954-c33ae9834250',
  'material-ui-31': 'b6777fbc-00c5-47eb-a0f1-c49439035084',
  'screenlane-32': 'a1bd4a7a-6dc4-4ad6-8bdb-ac0eb89e9dca',
};

// 读取 resources.json
const resourcesPath = path.join(__dirname, '../data/resources.json');
const resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));

// 更新 ID
const updatedResources = resources.map((resource) => {
  const newId = idMapping[resource.id];
  if (!newId) {
    console.warn(`Warning: No UUID mapping found for ${resource.id}`);
    return resource;
  }
  return {
    ...resource,
    id: newId,
  };
});

// 写回文件
fs.writeFileSync(resourcesPath, JSON.stringify(updatedResources, null, 2), 'utf8');

console.log('✅ Successfully updated resource IDs to UUIDs');
console.log(`Updated ${updatedResources.length} resources`);

// 输出映射表供参考
console.log('\nID Mapping:');
Object.entries(idMapping).forEach(([oldId, newId]) => {
  console.log(`  ${oldId} → ${newId}`);
});
