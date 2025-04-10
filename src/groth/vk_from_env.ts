import { GrothVk } from './vk.js';

// export static VK
const VK = GrothVk.parse(process.env.GROTH16_VK_PATH as string);
export { VK };
