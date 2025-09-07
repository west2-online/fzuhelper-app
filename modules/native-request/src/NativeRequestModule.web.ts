import dsBridge from 'dsbridge';

// Uint8Array 传输回来会有问题，变成{0: 66, 1: 77, 2: 166, ...}这样的格式，这里手动修正
function objectToUint8Array(obj: any) {
  const values: number[] = Object.values(obj);
  return new Uint8Array(values);
}

export default {
  async get(url: string, headers: any) {
    return new Promise(resolve => {
      console.log('get', url, headers.data);
      const args = { url, headers: headers.data };
      dsBridge.call('NativeRequest.get', args, (response: any) => {
        const resp = response;
        resp.data = objectToUint8Array(response.data);
        console.log('NativeRequest.get response:', resp.status, resp.data, resp.headers);
        resolve(resp);
      });
    });
  },

  post(...args: any) {
    console.log('TODO: post', args);
  },

  postJSON(...args: any) {
    console.log('TODO: postJSON', args);
  },
};
