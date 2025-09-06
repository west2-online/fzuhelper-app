// Reexport the native module. On web, it will be resolved to NativeBrightnessModule.web.ts
// and on native platforms to NativeBrightnessModule.ts
import NativeBrightnessModule from './src/NativeBrightnessModule';

export default NativeBrightnessModule;
