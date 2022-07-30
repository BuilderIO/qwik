import type { ReplMessageBase, ReplMessage } from '../types';
import { appUpdate } from './app-update';

export const receiveMessageFromMain = (ev: MessageEvent) => {
  if (ev.data) {
    const msg: ReplMessage = JSON.parse(ev.data);
    if (msg.type === 'update') {
      appUpdate(msg.clientId, msg.options);
    }
  }
};

export const sendMessageToReplServer = async (msg: ReplMessageBase) => {
  const clients: WindowClient[] = await (self as any).clients.matchAll();

  for (const client of clients) {
    if (client && client.url) {
      const url = new URL(client.url);
      const clientId = url.hash.split('#')[1];
      if (clientId && clientId === msg.clientId) {
        client.postMessage(msg);
        break;
      }
    }
  }
};

interface WindowClient {
  focused: boolean;
  frameType: 'nested';
  id: string;
  type: 'window';
  url: string;
  visibilityState: string;
  postMessage: (msg: ReplMessageBase) => void;
}
