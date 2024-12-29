import { EventEmitter } from 'expo-modules-core';

const emitter = new EventEmitter({} as any);

export default {
  async get(url: string) {
    return url + 'web';
  },
};
